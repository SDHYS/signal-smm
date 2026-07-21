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
 * - 실패해도 throw하지 않는다.
 *
 * ★ 이중 과금 방지 핵심 원칙: sentAt(발주 시도 시각)은 addOrder 호출 "전"에 원자 선점하고,
 *   이후 어떤 경우에도 자동으로 지우지 않는다(=외부 과금 시도의 영구 기록). 따라서
 *   addOrder가 성공했든/DB쓰기가 실패했든/프로세스가 죽었든, sentAt이 찍힌 아이템은
 *   재발주 루프(자동)에서 절대 다시 addOrder를 호출하지 않는다 → 도매 이중 과금 불가능.
 *   실패 시 providerError만 기록하며, 이 "sentAt 있음+providerOrderId 없음+error 있음"
 *   상태는 관리자가 명시적으로 확인 후 재발주(forceRedispatchItem)하게 한다.
 */
export async function dispatchOrderItem(itemId: string): Promise<DispatchResult> {
  // 로컬 개발/테스트에서 실도매 발주가 나가지 않도록 하는 안전 스위치
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
  // 주문 시점 스냅샷 우선, 없으면(과거 주문) 현재 상품 매핑 폴백
  const serviceId = item.providerServiceIdSnapshot ?? item.product.providerServiceId;
  if (!serviceId) return { ok: true, skipped: true };
  if (!item.targetUrl)
    return { ok: false, error: "주문 링크가 없어 발주할 수 없습니다." };
  if (item.order.status !== "PAID" && item.order.status !== "PROCESSING")
    return { ok: false, error: "발주 가능한 상태의 주문이 아닙니다." };

  // addOrder(외부 과금) 전에 sentAt을 원자 선점. 조건(providerOrderId·sentAt 모두 null)이라
  // 이미 시도된 아이템(자동 재발주 대상 포함)은 count===0으로 빠져 재과금하지 않는다.
  const claim = await prisma.orderItem.updateMany({
    where: { id: itemId, providerOrderId: null, sentAt: null },
    data: { sentAt: new Date() },
  });
  if (claim.count === 0)
    return { ok: true, skipped: true }; // 이미 발주 시도됨 — 자동 재과금 금지

  return await sendToProvider(item.id, serviceId, item.targetUrl, item.quantity);
}

/** 실제 도매 호출 + 결과 기록. sentAt은 이미 선점된 상태에서만 호출된다. */
async function sendToProvider(
  itemId: string,
  service: number,
  link: string,
  quantity: number,
): Promise<DispatchResult> {
  try {
    const providerOrderId = await addOrder({ service, link, quantity });
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { providerOrderId, providerStatus: "Pending", providerError: null },
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("dispatchOrderItem failed", { itemId }, e);
    // sentAt은 유지(과금 시도 기록) — providerError만 기록해 관리자 재발주 대상으로 표시
    await prisma.orderItem
      .update({ where: { id: itemId }, data: { providerError: msg } })
      .catch(() => {});
    return { ok: false, error: msg };
  }
}

/**
 * 관리자 명시적 재발주 — "발주 시도했으나 주문번호 없음(providerError 존재)" 상태에서만 허용.
 * 자동 경로(dispatchOrderItem)는 sentAt이 찍힌 건 다시 과금하지 않으므로, 실패건 재시도는
 * 관리자가 도매 대시보드에서 "실제로 발주 안 됐음"을 확인한 뒤 이 함수로만 수행한다.
 */
export async function forceRedispatchItem(itemId: string): Promise<DispatchResult> {
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
  if (item.providerOrderId) return { ok: true }; // 이미 발주됨
  const serviceId = item.providerServiceIdSnapshot ?? item.product.providerServiceId;
  if (!serviceId) return { ok: true, skipped: true };
  if (!item.targetUrl) return { ok: false, error: "주문 링크가 없습니다." };
  if (item.order.status !== "PAID" && item.order.status !== "PROCESSING")
    return { ok: false, error: "발주 가능한 상태의 주문이 아닙니다." };

  // sentAt 재선점 — 이미 정상 발주중(in-flight)인 건은 절대 건드리지 않는다.
  // in-flight = sentAt 있음 + providerError 없음 + providerOrderId 없음 (addOrder 호출 대기 중).
  // 이 창에서 재선점하면 addOrder가 두 번 호출돼 도매 이중과금 + 고아 주문이 생긴다.
  // 따라서 실패건(providerError 있음)이거나 아직 미시도(sentAt 없음)만 재발주 허용.
  const claim = await prisma.orderItem.updateMany({
    where: {
      id: itemId,
      providerOrderId: null,
      OR: [{ providerError: { not: null } }, { sentAt: null }],
    },
    data: { sentAt: new Date(), providerError: null },
  });
  if (claim.count === 0) return { ok: true, skipped: true };

  return await sendToProvider(item.id, serviceId, item.targetUrl, item.quantity);
}

async function forEachItem(
  orderId: string,
  fn: (id: string) => Promise<DispatchResult>,
): Promise<DispatchResult> {
  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: { id: true },
  });
  if (items.length === 0) return { ok: false, error: "주문 아이템이 없습니다." };

  let lastError: string | undefined;
  let anySkipped = false;
  for (const it of items) {
    const r = await fn(it.id);
    if (!r.ok) lastError = r.error;
    if (r.skipped) anySkipped = true;
  }
  return lastError ? { ok: false, error: lastError } : { ok: true, skipped: anySkipped };
}

/** 주문 자동 발주 (주문 생성 직후) — 미시도 아이템만 과금 */
export function dispatchOrder(orderId: string): Promise<DispatchResult> {
  return forEachItem(orderId, dispatchOrderItem);
}

/** 관리자 명시적 재발주 — 실패건(providerError)만 재시도 */
export function forceRedispatchOrder(orderId: string): Promise<DispatchResult> {
  return forEachItem(orderId, forceRedispatchItem);
}
