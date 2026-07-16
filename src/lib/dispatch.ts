import "server-only";
import { prisma } from "./prisma";
import { addOrder, smmConfigured } from "./smm";

export type DispatchResult = {
  ok: boolean;
  skipped?: boolean; // 미연동 상품/키 미설정 → 수동 모드
  error?: string;
};

/**
 * 주문 아이템 1건을 도매에 발주한다.
 * - 상품이 미연동이거나 SMM_API_KEY가 없으면 조용히 건너뛴다(수동 모드).
 * - 이미 발주된 아이템은 중복 발주하지 않는다(멱등).
 * - 실패해도 throw하지 않는다 — 주문 자체는 이미 결제 완료이므로,
 *   실패 사유를 providerError에 남겨 관리자 재발주 대상으로 표시한다.
 */
export async function dispatchOrderItem(itemId: string): Promise<DispatchResult> {
  // 로컬 개발/테스트에서 실도매 발주가 나가지 않도록 하는 안전 스위치
  // (.env에 SMM_DISPATCH_DISABLED=1 — 운영 Vercel에는 미설정)
  if (process.env.SMM_DISPATCH_DISABLED === "1") return { ok: true, skipped: true };
  if (!smmConfigured()) return { ok: true, skipped: true };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: {
      product: { select: { providerServiceId: true } },
      order: { select: { status: true } },
    },
  });
  if (!item) return { ok: false, error: "주문 아이템을 찾을 수 없습니다." };
  if (item.providerOrderId) return { ok: true }; // 이미 발주됨 (멱등)
  if (!item.product.providerServiceId) return { ok: true, skipped: true };
  if (!item.targetUrl)
    return { ok: false, error: "주문 링크가 없어 발주할 수 없습니다." };
  // 환불/취소·완료된 주문은 절대 발주하지 않는다 (환불 후 재발주로 도매비만 나가는 구멍 차단)
  if (item.order.status !== "PAID" && item.order.status !== "PROCESSING")
    return { ok: false, error: "발주 가능한 상태의 주문이 아닙니다." };

  // 동시 발주 방지: addOrder(외부 과금) 전에 DB에서 "발주 중" 선점.
  // sentAt 갱신을 원자 조건(providerOrderId: null, sentAt: null)으로 잠가,
  // 두 번째 동시 호출은 count===0으로 즉시 빠져나가 addOrder를 호출하지 않는다.
  const claim = await prisma.orderItem.updateMany({
    where: { id: itemId, providerOrderId: null, sentAt: null },
    data: { sentAt: new Date() },
  });
  if (claim.count === 0) {
    // 다른 호출이 이미 선점(발주 진행 중) — 중복 발주 방지
    return { ok: true, skipped: true };
  }

  try {
    const providerOrderId = await addOrder({
      service: item.product.providerServiceId,
      link: item.targetUrl,
      quantity: item.quantity,
    });
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { providerOrderId, providerStatus: "Pending", providerError: null },
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("dispatchOrderItem failed", { itemId }, e);
    // 실패 시 선점 해제(sentAt=null)해 관리자 재발주가 가능하도록 되돌린다
    await prisma.orderItem
      .update({ where: { id: itemId }, data: { providerError: msg, sentAt: null } })
      .catch(() => {});
    return { ok: false, error: msg };
  }
}

/** 주문의 모든 아이템 발주 (현재 구조는 주문당 1아이템) */
export async function dispatchOrder(orderId: string): Promise<DispatchResult> {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: { id: true },
  });
  if (items.length === 0) return { ok: false, error: "주문 아이템이 없습니다." };

  let lastError: string | undefined;
  let anySkipped = false;
  for (const it of items) {
    const r = await dispatchOrderItem(it.id);
    if (!r.ok) lastError = r.error;
    if (r.skipped) anySkipped = true;
  }
  return lastError
    ? { ok: false, error: lastError }
    : { ok: true, skipped: anySkipped };
}
