"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { rateLimit, RATE_LIMITED_MSG } from "@/lib/ratelimit";
import { dispatchOrder } from "@/lib/dispatch";
import { cancelOrders, smmConfigured } from "@/lib/smm";

export type OrderResult = { ok: boolean; error?: string; orderNo?: string };

export async function createOrder(input: {
  productId: string;
  quantity: number;
  targetUrl: string;
  clientKey?: string;
}): Promise<OrderResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  if (!(await rateLimit("order", { max: 10, windowMs: 60_000, key: user.id })))
    return { ok: false, error: RATE_LIMITED_MSG };

  // 멱등성: 같은 clientKey로 이미 생성된 주문이 있으면 재생성 없이 그대로 반환
  const clientKey = input.clientKey?.trim() || null;
  if (clientKey) {
    const dup = await prisma.order.findUnique({
      where: { clientKey },
      select: { orderNo: true, userId: true },
    });
    if (dup) {
      if (dup.userId !== user.id) return { ok: false, error: "잘못된 요청입니다." };
      return { ok: true, orderNo: dup.orderNo };
    }
  }

  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });
  if (!product || !product.isActive)
    return { ok: false, error: "존재하지 않는 상품입니다." };

  const qty = Math.floor(input.quantity);
  if (!Number.isSafeInteger(qty) || qty < product.minQty || qty > product.maxQty)
    return {
      ok: false,
      error: `수량은 ${product.minQty} ~ ${product.maxQty} 사이여야 합니다.`,
    };

  const targetUrl = input.targetUrl?.trim() ?? "";
  if (!targetUrl) return { ok: false, error: "주문 링크를 입력해주세요." };

  const total = product.unitPrice * qty;
  // 같은 밀리초에 동시 주문이 몰려도 충돌하지 않도록 난수 폭 확보
  const orderNo = `${Date.now()}${Math.floor(Math.random() * 900000 + 100000)}`;

  let createdOrderId: string | null = null;
  try {
    await prisma.$transaction(async (tx) => {
      // 잔액 차감(잔액 충분할 때만) — 동시성 방지
      const dec = await tx.user.updateMany({
        where: { id: user.id, balance: { gte: total } },
        data: { balance: { decrement: total } },
      });
      if (dec.count === 0) throw new Error("INSUFFICIENT");

      const created = await tx.order.create({
        data: {
          orderNo,
          clientKey,
          userId: user.id,
          status: "PAID",
          totalAmount: total,
          paidAt: new Date(),
          items: {
            create: {
              productId: product.id,
              productName: product.name,
              unitPrice: product.unitPrice,
              quantity: qty,
              subtotal: total,
              targetUrl,
            },
          },
        },
      });
      createdOrderId = created.id;
    });
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT")
      return { ok: false, error: "잔액이 부족합니다. 충전 후 이용해주세요." };
    // clientKey 유니크 충돌 = 동시 중복 제출 → 먼저 생성된 주문을 그대로 반환 (차감은 롤백됨)
    if ((e as { code?: string })?.code === "P2002" && clientKey) {
      const dup = await prisma.order.findUnique({
        where: { clientKey },
        select: { orderNo: true, userId: true },
      });
      if (dup?.userId === user.id) return { ok: true, orderNo: dup.orderNo };
    }
    console.error("createOrder failed", e);
    return { ok: false, error: "주문 처리 중 오류가 발생했습니다." };
  }

  // 도매 자동 발주 — 실패해도 주문은 유효 (관리자가 재발주)
  if (createdOrderId) {
    try {
      await dispatchOrder(createdOrderId);
    } catch (e) {
      console.error("createOrder: dispatch failed", { orderId: createdOrderId }, e);
    }
  }

  revalidatePath("/orders");
  revalidatePath("/");
  return { ok: true, orderNo };
}

// ── 관리자: 발주/재발주 ───────────────────────────────
export async function redispatchOrder(id: string): Promise<OrderResult> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return { ok: false, error: "권한이 없습니다." };

  const res = await dispatchOrder(id);
  revalidatePath("/admin/orders");
  if (!res.ok) return { ok: false, error: res.error };
  if (res.skipped)
    return { ok: false, error: "도매 미연동 상품이거나 API 키가 없습니다." };
  return { ok: true };
}

// ── 관리자: 도매 상태 수동 동기화 ─────────────────────
export async function syncOrdersAction(): Promise<
  OrderResult & { summary?: string }
> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return { ok: false, error: "권한이 없습니다." };

  try {
    const { syncProviderOrders } = await import("@/lib/sync-orders");
    const r = await syncProviderOrders();
    revalidatePath("/admin/orders");
    revalidatePath("/orders");
    if ("skipped" in r) return { ok: false, error: r.skipped };
    return {
      ok: true,
      summary: `확인 ${r.checked}건 — 진행 ${r.processing} · 완료 ${r.completed} · 부분 ${r.partial} · 취소 ${r.cancelled} · 오류 ${r.errors}`,
    };
  } catch (e) {
    console.error("syncOrdersAction failed", e);
    return { ok: false, error: "동기화 중 오류가 발생했습니다." };
  }
}

// ── 관리자: 주문 상태 변경 ────────────────────────────
type OrderStatus = "PAID" | "PROCESSING" | "COMPLETED";

type AnyOrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "COMPLETED"
  | "CANCELLED";

// 허용되는 상태 전이(from) — 환불(CANCELLED)된 주문은 어떤 상태로도 되돌릴 수 없음
const ALLOWED_FROM: Record<OrderStatus, AnyOrderStatus[]> = {
  PAID: ["PENDING_PAYMENT"],
  PROCESSING: ["PAID"],
  COMPLETED: ["PAID", "PROCESSING"],
};

export async function setOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<OrderResult> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return { ok: false, error: "권한이 없습니다." };

  const updated = await prisma.order.updateMany({
    where: { id, status: { in: ALLOWED_FROM[status] } },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });
  if (updated.count === 0)
    return { ok: false, error: "현재 상태에서는 변경할 수 없습니다." };

  const order = await prisma.order.findUnique({
    where: { id },
    select: { userId: true, orderNo: true },
  });
  const label: Record<OrderStatus, string> = {
    PAID: "결제완료",
    PROCESSING: "진행중",
    COMPLETED: "완료",
  };
  if (order)
    await notify(order.userId, {
      type: "order",
      title: `주문 #${order.orderNo}이(가) ${label[status]} 처리되었습니다.`,
      link: "/orders",
    });

  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  return { ok: true };
}

// ── 관리자: 주문 메모 저장 ────────────────────────────
export async function setOrderMemo(id: string, memo: string): Promise<OrderResult> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return { ok: false, error: "권한이 없습니다." };

  const trimmed = memo.trim();
  await prisma.order.update({
    where: { id },
    data: { adminMemo: trimmed || null },
  });

  revalidatePath("/admin/orders");
  return { ok: true };
}

// ── 관리자: 주문 환불(취소 + 잔액 복구) ───────────────
export async function refundOrder(id: string): Promise<OrderResult> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return { ok: false, error: "권한이 없습니다." };

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return { ok: false, error: "주문을 찾을 수 없습니다." };

  try {
    await prisma.$transaction(async (tx) => {
      // 상태 전환을 원자적으로 선점 — 동시 클릭해도 1건만 통과 (이중 환불 방지)
      const upd = await tx.order.updateMany({
        where: { id, status: { in: ["PAID", "PROCESSING"] } },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      if (upd.count === 0) throw new Error("NOT_REFUNDABLE");

      await tx.user.update({
        where: { id: order.userId },
        data: { balance: { increment: order.totalAmount } },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "NOT_REFUNDABLE")
      return { ok: false, error: "환불할 수 없는 상태의 주문입니다." };
    console.error("refundOrder failed", e);
    return { ok: false, error: "환불 처리 중 오류가 발생했습니다." };
  }

  // 도매에 이미 발주된 건이면 취소 요청 (best-effort — 미지원 서비스는 실패해도 무방)
  if (smmConfigured()) {
    try {
      const items = await prisma.orderItem.findMany({
        where: { orderId: id, providerOrderId: { not: null } },
        select: { providerOrderId: true },
      });
      if (items.length > 0)
        await cancelOrders(items.map((i) => i.providerOrderId!));
    } catch (e) {
      console.error("refundOrder: provider cancel failed", { orderId: id }, e);
    }
  }

  await notify(order.userId, {
    type: "order",
    title: `주문 #${order.orderNo}이(가) 환불되었습니다. ${order.totalAmount.toLocaleString()}원이 잔액으로 복구되었습니다.`,
    link: "/orders",
  });

  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  return { ok: true };
}
