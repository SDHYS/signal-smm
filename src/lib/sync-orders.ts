import "server-only";
import { prisma } from "./prisma";
import { getOrdersStatus, smmConfigured } from "./smm";
import { notify } from "./notify";
import { logAdmin } from "./audit";

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
 *
 * ※ 불변식: 주문당 발주 아이템은 1건 (createOrder가 단일 아이템만 생성).
 *   부분/전액 환불이 주문 상태에 묶여 있어 이 불변식에 의존한다. 다중 아이템
 *   주문을 도입하려면 환불을 아이템 단위로 재설계해야 하며, 아래 가드가
 *   그 전까지 잘못된 정산을 막는다(다중 발주 아이템 주문은 자동 처리에서 제외).
 */
export async function syncProviderOrders(): Promise<SyncSummary | { skipped: string }> {
  if (!smmConfigured()) return { skipped: "SMM_API_KEY 미설정" };

  // 진행 중인 발주 건만 조회 (최대 100건/회 — 표준 API 한도)
  const items = await prisma.orderItem.findMany({
    where: {
      providerOrderId: { not: null },
      order: { status: { in: ["PAID", "PROCESSING"] } },
    },
    include: {
      order: {
        select: {
          id: true,
          orderNo: true,
          userId: true,
          status: true,
          _count: { select: { items: true } },
        },
      },
    },
    orderBy: { sentAt: "asc" },
    take: 100,
  });

  const summary: SyncSummary = { checked: items.length, processing: 0, completed: 0, partial: 0, cancelled: 0, errors: 0 };
  if (items.length === 0) return summary;

  const statuses = await getOrdersStatus(items.map((i) => i.providerOrderId!));

  for (const item of items) {
    // 한 아이템의 어떤 예외도 이 루프를 중단시키지 않도록 전체를 격리 (poison-pill 방지)
    try {
    const st = statuses[item.providerOrderId!];
    if (!st) continue;

    // 불변식 가드: 다중 아이템 주문은 주문 단위 환불이 오정산되므로 자동 처리에서 제외
    if (item.order._count.items > 1) {
      summary.errors++;
      console.error("syncProviderOrders: 다중 아이템 주문 자동 정산 제외", {
        orderId: item.order.id,
        items: item.order._count.items,
      });
      await prisma.orderItem
        .update({
          where: { id: item.id },
          data: { syncedAt: new Date(), providerError: "다중 아이템 주문 — 관리자 수동 처리 필요" },
        })
        .catch(() => {});
      continue;
    }

    if ("error" in st) {
      summary.errors++;
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { providerError: st.error, syncedAt: new Date() },
      });
      continue;
    }

    // 상태 필드가 없는 예상외 응답 방어 (undefined.toLowerCase 크래시 → 전체 run 중단 방지)
    const status = typeof st.status === "string" ? st.status : "";
    if (!status) {
      summary.errors++;
      console.error("syncProviderOrders: 도매 응답에 상태 없음", { itemId: item.id });
      continue;
    }
    // 잔여 수량은 0~주문수량으로 클램프 — 공급사 오응답이 과다 환불로 이어지는 것 차단
    const remains = Math.min(item.quantity, Math.max(0, Number(st.remains) || 0));
    const s = status.toLowerCase();

    // 아이템 스냅샷은 항상 갱신
    await prisma.orderItem.update({
      where: { id: item.id },
      data: { providerStatus: status, providerRemains: remains, syncedAt: new Date() },
    });

    {
      // 완료로 왔지만 잔여수량이 남아 있으면 부분완료로 처리 (도매가 completed+remains를 줄 수 있음)
      const isPartial = s === "partial" || (s === "completed" && remains > 0);
      if (s === "completed" && remains === 0) {
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
      } else if (isPartial) {
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
          if (refund > 0) {
            await notify(item.order.userId, {
              type: "order",
              title: `주문 #${item.order.orderNo}이(가) 부분 완료되었습니다. 미처리 ${remains.toLocaleString()}개(${refund.toLocaleString()}원)가 잔액으로 환불되었습니다.`,
              link: "/orders",
            });
            await logAdmin({
              action: "sync.refund",
              targetType: "order",
              targetId: item.order.id,
              targetLabel: `#${item.order.orderNo}`,
              amount: refund,
              reason: `도매 부분완료 — 미처리 ${remains.toLocaleString()}개 자동환불`,
              meta: { kind: "partial", remains, providerStatus: status },
            });
          }
        }
      } else if (
        s === "canceled" ||
        s === "cancelled" ||
        s === "refunded" ||
        s === "fail" ||
        s === "failed" ||
        s === "error"
      ) {
        // 도매 측 취소/실패/에러: 전액 환불
        const refunded = await prisma.$transaction(async (tx) => {
          const upd = await tx.order.updateMany({
            where: { id: item.order.id, status: { in: ["PAID", "PROCESSING"] } },
            data: {
              status: "CANCELLED",
              cancelledAt: new Date(),
              adminMemo: `도매 측 ${status} — 전액 자동 환불`,
            },
          });
          if (upd.count !== 1) return null;
          const order = await tx.order.findUnique({
            where: { id: item.order.id },
            select: { totalAmount: true },
          });
          const amt = order?.totalAmount ?? 0;
          await tx.user.update({
            where: { id: item.order.userId },
            data: { balance: { increment: amt } },
          });
          return amt;
        });
        if (refunded !== null) {
          summary.cancelled++;
          await notify(item.order.userId, {
            type: "order",
            title: `주문 #${item.order.orderNo}이(가) 처리 불가로 취소되어 전액 환불되었습니다.`,
            link: "/orders",
          });
          await logAdmin({
            action: "sync.refund",
            targetType: "order",
            targetId: item.order.id,
            targetLabel: `#${item.order.orderNo}`,
            amount: refunded,
            reason: `도매 측 ${status} — 전액 자동환불`,
            meta: { kind: "cancel", providerStatus: status },
          });
        }
      } else if (
        s === "pending" ||
        s === "in progress" ||
        s === "inprogress" ||
        s === "in_progress" ||
        s === "processing"
      ) {
        // 진행 중 → PROCESSING
        const upd = await prisma.order.updateMany({
          where: { id: item.order.id, status: "PAID" },
          data: { status: "PROCESSING" },
        });
        if (upd.count === 1) summary.processing++;
      } else {
        // 매핑되지 않은 미지 상태 — 임의로 상태 전이하지 않고 로그만 남긴다
        // (조용히 PROCESSING으로 흘려보내 환불 누락되는 것 방지)
        summary.errors++;
        console.error("syncProviderOrders: 미매핑 도매 상태", {
          itemId: item.id,
          orderNo: item.order.orderNo,
          status,
        });
      }
    }
    } catch (e) {
      // 이 아이템 처리 실패 — 다음 아이템으로 계속 (전체 run 중단 방지)
      summary.errors++;
      console.error("syncProviderOrders: item sync failed", { itemId: item.id }, e);
    }
  }

  return summary;
}
