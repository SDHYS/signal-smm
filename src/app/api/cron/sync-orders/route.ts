import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrdersStatus, smmConfigured } from "@/lib/smm";
import { notify } from "@/lib/notify";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 도매 주문 상태 동기화 (Vercel Cron이 10분마다 호출)
 *
 * 상태 매핑:
 *  - Pending / In progress / Processing → 우리 PROCESSING
 *  - Completed → 우리 COMPLETED + 알림
 *  - Partial   → 잔여수량 × 판매단가 환불 + COMPLETED + 알림
 *  - Canceled / Refunded / Fail → 전액 환불 + CANCELLED + 알림
 *
 * 환불은 주문 상태 전이(updateMany 가드)에 묶여 있어 크론이 중복 실행돼도
 * 잔액이 두 번 반영되지 않는다.
 */
export async function GET(req: Request) {
  // 인증: CRON_SECRET 설정 시 Bearer 일치 필수 (Vercel Cron 표준)
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret) {
    if (auth !== `Bearer ${secret}`)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "CRON_SECRET 미설정 — 운영에서는 필수입니다." },
      { status: 503 },
    );
  }

  if (!smmConfigured())
    return NextResponse.json({ ok: true, skipped: "SMM_API_KEY 미설정" });

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
  if (items.length === 0)
    return NextResponse.json({ ok: true, checked: 0 });

  let statuses;
  try {
    statuses = await getOrdersStatus(items.map((i) => i.providerOrderId!));
  } catch (e) {
    console.error("sync-orders: status fetch failed", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }

  const summary = { checked: items.length, processing: 0, completed: 0, partial: 0, cancelled: 0, errors: 0 };

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
    const remains = Math.max(0, Number(st.remains) || 0);
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
        await prisma.$transaction(async (tx) => {
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
          if (upd.count === 1) summary.partial++;
        });
        if (refund > 0)
          await notify(item.order.userId, {
            type: "order",
            title: `주문 #${item.order.orderNo}이(가) 부분 완료되었습니다. 미처리 ${remains.toLocaleString()}개(${refund.toLocaleString()}원)가 잔액으로 환불되었습니다.`,
            link: "/orders",
          });
      } else if (s === "canceled" || s === "cancelled" || s === "refunded" || s === "fail") {
        // 도매 측 취소/실패: 전액 환불
        await prisma.$transaction(async (tx) => {
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
            summary.cancelled++;
          }
        });
        await notify(item.order.userId, {
          type: "order",
          title: `주문 #${item.order.orderNo}이(가) 처리 불가로 취소되어 전액 환불되었습니다.`,
          link: "/orders",
        });
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
      console.error("sync-orders: item sync failed", { itemId: item.id, status }, e);
    }
  }

  return NextResponse.json({ ok: true, ...summary });
}
