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
  if (!smmConfigured()) return { ok: true, skipped: true };

  const item = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { product: { select: { providerServiceId: true } } },
  });
  if (!item) return { ok: false, error: "주문 아이템을 찾을 수 없습니다." };
  if (item.providerOrderId) return { ok: true }; // 이미 발주됨 (멱등)
  if (!item.product.providerServiceId) return { ok: true, skipped: true };
  if (!item.targetUrl)
    return { ok: false, error: "주문 링크가 없어 발주할 수 없습니다." };

  try {
    const providerOrderId = await addOrder({
      service: item.product.providerServiceId,
      link: item.targetUrl,
      quantity: item.quantity,
    });
    // 동시 재발주 경합 방지 — 아직 미발주 상태일 때만 기록
    const upd = await prisma.orderItem.updateMany({
      where: { id: itemId, providerOrderId: null },
      data: {
        providerOrderId,
        providerStatus: "Pending",
        providerError: null,
        sentAt: new Date(),
      },
    });
    if (upd.count === 0)
      console.error("dispatchOrderItem: 중복 발주 감지", { itemId, providerOrderId });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("dispatchOrderItem failed", { itemId }, e);
    await prisma.orderItem
      .update({ where: { id: itemId }, data: { providerError: msg } })
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
