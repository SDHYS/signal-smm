"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { rateLimit, RATE_LIMITED_MSG } from "@/lib/ratelimit";
import { dispatchOrder, forceRedispatchOrder } from "@/lib/dispatch";
import { cancelOrders, smmConfigured, dispatchActive } from "@/lib/smm";
import { logAdmin } from "@/lib/audit";

export type OrderResult = { ok: boolean; error?: string; orderNo?: string; note?: string };

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

  // 실발주가 활성인 상태에서 미연동(도매 미보유) 상품은 직접 주문 불가 → 1:1 문의로 안내.
  // (자동 발주가 안 되는 상품을 팔면 잔액만 빠지고 방치되므로 원천 차단.
  //  로컬/테스트(SMM_DISPATCH_DISABLED=1)에서는 시드 상품으로 흐름을 검증할 수 있게 완화)
  if (dispatchActive() && product.providerServiceId == null)
    return {
      ok: false,
      error: "이 상품은 현재 자동 주문이 지원되지 않습니다. 1:1 문의로 접수해 주세요.",
    };

  const qty = Math.floor(input.quantity);
  if (!Number.isSafeInteger(qty) || qty < product.minQty || qty > product.maxQty)
    return {
      ok: false,
      error: `수량은 ${product.minQty} ~ ${product.maxQty} 사이여야 합니다.`,
    };

  const targetUrl = input.targetUrl?.trim() ?? "";
  if (!targetUrl) return { ok: false, error: "주문 링크를 입력해주세요." };
  // http(s)만 허용 — javascript:/data: 등 위험 스킴 차단 (관리자 화면 XSS 방지)
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(targetUrl);
  } catch {
    return { ok: false, error: "올바른 링크(URL)를 입력해주세요." };
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:")
    return { ok: false, error: "http 또는 https로 시작하는 링크만 입력할 수 있습니다." };

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
              // 주문 시점 도매 서비스 ID 스냅샷 — 이후 상품이 재매핑돼도 이 서비스로 발주
              providerServiceIdSnapshot: product.providerServiceId,
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

  // 주문 단위 rate limit — 따닥 클릭 시 이중 발주 시도 자체를 억제
  if (!(await rateLimit("redispatch", { max: 1, windowMs: 10_000, key: id })))
    return { ok: false, error: "잠시 후 다시 시도해주세요." };

  // 관리자 명시적 재발주는 실패건(providerError)만 재과금 — 정상 발주중 건은 스킵
  const res = await forceRedispatchOrder(id);
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

  // 허용 매트릭스에 없는 상태(CANCELLED/PENDING_PAYMENT 등)는 거부.
  // 이 가드가 없으면 ALLOWED_FROM[status]=undefined → Prisma가 from-필터를 무시하고
  // id만으로 매칭 → 환불·감사 없이 취소/다운그레이드되는 우회가 발생한다.
  // (환불은 refundOrder만 통해야 잔액 복구·감사가 함께 이뤄진다.)
  if (!ALLOWED_FROM[status])
    return { ok: false, error: "지원하지 않는 상태 변경입니다." };

  // 도매 발주된 주문의 수동 '완료'는 금지 — 도매가 Partial로 끝나면 자동 잔여환불이
  // 무효화되어 고객이 손해본다. 도매 연동 주문은 상태 동기화가 완료/환불을 결정한다.
  if (status === "COMPLETED") {
    // sentAt 기준(providerOrderId 아님) — 발주 시도는 sentAt을 addOrder 전에 찍으므로
    // in-flight(주문번호 아직 없음) 건도 포착해 수동완료로 인한 부분환불 유실을 막는다.
    const dispatched = await prisma.orderItem.count({
      where: { orderId: id, sentAt: { not: null } },
    });
    if (dispatched > 0)
      return {
        ok: false,
        error: "도매 발주된 주문은 '도매 상태 동기화'로만 완료됩니다. 수동 완료 불가.",
      };
  }

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

  await logAdmin({
    action: "order.status",
    targetType: "order",
    targetId: id,
    targetLabel: order ? `#${order.orderNo}` : id,
    meta: { status },
    admin: { id: admin.id, name: admin.name },
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
export async function refundOrder(id: string, reason?: string): Promise<OrderResult> {
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

  // 도매에 이미 발주된 건이면 취소 요청. 발주된 주문을 환불하면 도매 작업은 계속돼
  // 도매비만 나갈 수 있으므로, 취소 요청 성공/실패를 관리자 메모에 남겨 손실을 인지시킨다.
  let cancelNote: string | undefined;
  if (smmConfigured()) {
    const dispatched = await prisma.orderItem.findMany({
      where: { orderId: id, providerOrderId: { not: null } },
      select: { providerOrderId: true },
    });
    if (dispatched.length > 0) {
      try {
        await cancelOrders(dispatched.map((i) => i.providerOrderId!));
        cancelNote = `도매 취소 요청됨(#${dispatched.map((i) => i.providerOrderId).join(",")}) — 실제 취소 여부는 도매 상태 동기화로 확인 필요`;
      } catch (e) {
        console.error("refundOrder: provider cancel failed", { orderId: id }, e);
        cancelNote = `⚠ 도매 취소 요청 실패 — 도매 작업이 계속될 수 있음(도매비 손실 주의). 도매 패널에서 직접 취소 확인 필요`;
      }
      await prisma.order
        .update({
          where: { id },
          data: {
            adminMemo: `${order.adminMemo ? order.adminMemo + " / " : ""}${cancelNote}`,
          },
        })
        .catch(() => {});
    }
  }

  await notify(order.userId, {
    type: "order",
    title: `주문 #${order.orderNo}이(가) 환불되었습니다. ${order.totalAmount.toLocaleString()}원이 잔액으로 복구되었습니다.`,
    link: "/orders",
  });

  await logAdmin({
    action: "order.refund",
    targetType: "order",
    targetId: id,
    targetLabel: `#${order.orderNo}`,
    amount: order.totalAmount,
    reason: reason ?? null,
    meta: cancelNote ? { cancelNote } : null,
    admin: { id: admin.id, name: admin.name },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  return { ok: true, note: cancelNote };
}
