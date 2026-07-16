import "server-only";
import { prisma } from "./prisma";
import { getOrdersStatus, smmConfigured } from "./smm";
import { notify } from "./notify";

export type SyncSummary = {
  checked: number;
  processing: number;
  completed: number;
  partial: number;
  cancelled: number;
  errors: number;
};

/**
 * 도매 주문 상태 동기화 — 크론과 관리자 수동 버튼이 공유.
 *
 * 상태 매핑:
 *  - Pending / In progress / Processing → 우리 PROCESSING
 *  - Completed → 우리 COMPLETED + 알림
 *  - Partial   → 잔여수량 × 판매단가 환불 + COMPLETED + 알림
 *  - Canceled / Refunded / Fail → 전액 환불 + CANCELLED + 알림
 *
 * 환불은 주문 상태 전이(updateMany 가드)에 묶여 있어 중복 실행돼도
 * 잔액이 두 번 반영되지 않는다.
 */
export async function syncProviderOrders(): Promise<SyncSummary | { skipped: string }> {
  if (!smmConfigured()) return { skipped: "SMM_API_KEY 미설정" };

  // 진행 중인 발주 건만 조회 (최대 100건/회 — 표준 API 한도)
  const items = await prisma.orderItem.findMany({
    where: {
      providerOrderId: { not: null },
      order: { status: { in: ["PAID", "PROCESSING"] } },
    },
    include: { order: { select: { id: true, orderNo: true, userId: true, status: true } } },
    orderBy: { sentAt: "asc" },
    take: 100,
  });

  const summary: SyncSummary = { checked: items.length, processing: 0, completed: 0, partial: 0, cancelled: 0, errors: 0 };
  if (items.length === 0) return summary;

  const statuses = await getOrdersStatus(items.map((i) => i.providerOrderId!));

  for (const item of items) {
    const st = statuses[item.providerOrderId!];
    if (!st) continue;

    if ("error" in st) {
      summary.errors++;
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { providerError: st.error, syncedAt: new Date() },
      });
      continue;
    }

    const status = st.status;
    // 잔여 수량은 0~주문수량으로 클램프 — 공급사 오응답이 과다 환불로 이어지는 것 차단
    const remains = Math.min(item.quantity, Math.max(0, Number(st.remains) || 0));
    const s = status.toLowerCase();

    // 아이템 스냅샷은 항상 갱신
    await prisma.orderItem.update({
      where: { id: item.id },
      data: { providerStatus: status, providerRemains: remains, syncedAt: new Date() },
    });

    try {
      if (s === "completed") {
        const upd = await prisma.order.updateMany({
          where: { id: item.order.id, status: { in: ["PAID", "PROCESSING"] } },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
        if (upd.count === 1) {
          summary.completed++;
          await notify(item.order.userId, {
            type: "order",
            title: `주문 #${item.order.orderNo} 작업이 완료되었습니다.`,
            link: "/orders",
          });
        }
      } else if (s === "partial") {
        // 부분완료: 상태 전이 1회에만 잔여분 환불 (중복 실행 안전)
        const refund = remains * item.unitPrice;
        // 상태 전환을 실제로 이 실행이 선점했을 때만(count===1) 환불·알림 (동시 실행 시 허위 알림 방지)
        const claimed = await prisma.$transaction(async (tx) => {
          const upd = await tx.order.updateMany({
            where: { id: item.order.id, status: { in: ["PAID", "PROCESSING"] } },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
              adminMemo: `부분완료 — 미처리 ${remains.toLocaleString()}개, ${refund.toLocaleString()}원 자동 환불`,
            },
          });
          if (upd.count === 1 && refund > 0) {
            await tx.user.update({
              where: { id: item.order.userId },
              data: { balance: { increment: refund } },
            });
          }
          return upd.count === 1;
        });
        if (claimed) {
          summary.partial++;
          if (refund > 0)
            await notify(item.order.userId, {
              type: "order",
              title: `주문 #${item.order.orderNo}이(가) 부분 완료되었습니다. 미처리 ${remains.toLocaleString()}개(${refund.toLocaleString()}원)가 잔액으로 환불되었습니다.`,
              link: "/orders",
            });
        }
      } else if (s === "canceled" || s === "cancelled" || s === "refunded" || s === "fail") {
        // 도매 측 취소/실패: 전액 환불
        const claimed = await prisma.$transaction(async (tx) => {
          const upd = await tx.order.updateMany({
            where: { id: item.order.id, status: { in: ["PAID", "PROCESSING"] } },
            data: {
              status: "CANCELLED",
              cancelledAt: new Date(),
              adminMemo: `도매 측 ${status} — 전액 자동 환불`,
            },
          });
          if (upd.count === 1) {
            const order = await tx.order.findUnique({
              where: { id: item.order.id },
              select: { totalAmount: true },
            });
            await tx.user.update({
              where: { id: item.order.userId },
              data: { balance: { increment: order?.totalAmount ?? 0 } },
            });
          }
          return upd.count === 1;
        });
        if (claimed) {
          summary.cancelled++;
          await notify(item.order.userId, {
            type: "order",
            title: `주문 #${item.order.orderNo}이(가) 처리 불가로 취소되어 전액 환불되었습니다.`,
            link: "/orders",
          });
        }
      } else {
        // Pending / In progress / Processing → 진행중
        const upd = await prisma.order.updateMany({
          where: { id: item.order.id, status: "PAID" },
          data: { status: "PROCESSING" },
        });
        if (upd.count === 1) summary.processing++;
      }
    } catch (e) {
      summary.errors++;
      console.error("syncProviderOrders: item sync failed", { itemId: item.id, status }, e);
    }
  }

  return summary;
}
