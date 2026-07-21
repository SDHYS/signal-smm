import type { Prisma } from "@prisma/client";

// 발주 시도 후 이 시간이 지나도 도매 주문번호가 없으면 "멈춤/고아"로 간주.
// addOrder 타임아웃은 30초라, 5분이면 확실히 정상 in-flight가 아니다.
export const STUCK_AFTER_MS = 5 * 60_000;

/**
 * 관리자 주목이 필요한 "발주 실패/멈춤" 주문 필터.
 * 진행 가능 상태(PAID/PROCESSING)인데 도매 주문번호가 없고,
 *  - providerError가 있거나(명시적 실패), 또는
 *  - sentAt이 STUCK_AFTER_MS 이전(발주 시도했는데 오래도록 미완료 = 고아)
 * in-flight(방금 sentAt·에러 없음)는 시간 조건으로 제외해 오탐을 막는다.
 * providerError 기록마저 실패한 조용한 고아도 sentAt 조건으로 포착된다.
 */
export function failedDispatchFilter(now = Date.now()): Prisma.OrderWhereInput {
  return {
    status: { in: ["PAID", "PROCESSING"] },
    items: {
      some: {
        providerOrderId: null,
        OR: [
          { providerError: { not: null } },
          { sentAt: { lt: new Date(now - STUCK_AFTER_MS) } },
        ],
      },
    },
  };
}
