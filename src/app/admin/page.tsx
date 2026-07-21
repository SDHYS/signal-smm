import { prisma } from "@/lib/prisma";
import AdminCharges, { type PendingCharge } from "@/components/admin/AdminCharges";
import AdminMessage from "@/components/admin/AdminMessage";
import DashboardStats, { type Stat } from "@/components/admin/DashboardStats";
import RevenueChart, { type DayRevenue } from "@/components/admin/RevenueChart";
import { getBalance, smmConfigured } from "@/lib/smm";
import { failedDispatchFilter } from "@/lib/order-filters";

// 도매 잔액·발주실패 조회를 위해 요청 시 렌더 고정 (빌드 중 외부 API 호출 방지)
export const dynamic = "force-dynamic";

const won = (n: number) => `${n.toLocaleString()}원`;

export default async function AdminPage() {
  // 오늘 0시 기준(KST). 서버가 UTC일 수 있으므로 KST 오프셋으로 계산.
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstNow = new Date(now.getTime() + kstOffset);
  const kstMidnight = new Date(
    Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()),
  );
  const todayStart = new Date(kstMidnight.getTime() - kstOffset);

  const [
    pending,
    pendingCount,
    confirmedCount,
    processed,
    memberCount,
    todayOrders,
    todaySales,
    processingCount,
    pendingInquiries,
    recentOrders,
    failedDispatchCount,
  ] = await Promise.all([
    // 표시는 최근 100건까지 (백로그가 커도 대시보드 메모리·렌더 폭주 방지)
    prisma.chargeRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: { user: { select: { username: true, name: true } } },
    }),
    prisma.chargeRequest.count({ where: { status: "PENDING" } }),
    prisma.chargeRequest.count({ where: { status: "CONFIRMED" } }),
    prisma.chargeRequest.findMany({
      where: { status: { not: "PENDING" } },
      orderBy: { updatedAt: "desc" },
      take: 10,
      include: { user: { select: { username: true, name: true } } },
    }),
    prisma.user.count(),
    prisma.order.count({
      where: { createdAt: { gte: todayStart }, status: { not: "CANCELLED" } },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: todayStart }, status: { not: "CANCELLED" } },
    }),
    prisma.order.count({ where: { status: "PROCESSING" } }),
    prisma.inquiry.count({ where: { status: "PENDING" } }),
    // 최근 30일 매출 차트용 (환불 제외)
    prisma.order.findMany({
      where: {
        createdAt: { gte: new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000) },
        status: { not: "CANCELLED" },
      },
      select: { createdAt: true, totalAmount: true },
    }),
    // 발주실패/멈춤 주문 건수 (에러 있거나 오래 미완료 = 고아 포함)
    prisma.order.count({ where: failedDispatchFilter() }),
  ]);

  // 도매 잔액 (외부 API — 실패해도 대시보드는 떠야 하므로 격리)
  let providerBalance: number | null = null;
  if (smmConfigured()) {
    try {
      providerBalance = Number((await getBalance()).balance);
    } catch {
      providerBalance = null;
    }
  }

  // 30일 일별 매출 집계 (KST 날짜 기준)
  const byDay = new Map<string, { amount: number; orders: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(kstMidnight.getTime() - i * 24 * 60 * 60 * 1000);
    byDay.set(d.toISOString().slice(0, 10), { amount: 0, orders: 0 });
  }
  for (const o of recentOrders) {
    const key = new Date(o.createdAt.getTime() + kstOffset).toISOString().slice(0, 10);
    const slot = byDay.get(key);
    if (slot) {
      slot.amount += o.totalAmount;
      slot.orders += 1;
    }
  }
  const revenueDays: DayRevenue[] = [...byDay.entries()].map(([date, v]) => ({
    date,
    label: `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`,
    amount: v.amount,
    orders: v.orders,
  }));
  const revenueTotal = revenueDays.reduce((sum, d) => sum + d.amount, 0);

  const stats: Stat[] = [
    { label: "오늘 주문", value: `${todayOrders}건`, accent: "blue", href: "/admin/orders" },
    {
      label: "오늘 매출",
      value: won(todaySales._sum.totalAmount ?? 0),
      sub: "환불 제외",
      accent: "green",
    },
    {
      label: "입금 대기",
      value: `${pendingCount}건`,
      accent: "orange",
      sub: "처리 필요",
    },
    {
      label: "진행중 주문",
      value: `${processingCount}건`,
      href: "/admin/orders?status=PROCESSING",
    },
    {
      label: "미답변 문의",
      value: `${pendingInquiries}건`,
      accent: pendingInquiries > 0 ? "orange" : "navy",
      href: "/admin/inquiries",
    },
    {
      label: "전체 회원",
      value: `${memberCount.toLocaleString()}명`,
      href: "/admin/members",
    },
    {
      label: "발주 실패",
      value: `${failedDispatchCount}건`,
      accent: failedDispatchCount > 0 ? "red" : "navy",
      sub: failedDispatchCount > 0 ? "즉시 조치" : undefined,
      href: "/admin/orders?filter=failed",
    },
    // 도매 잔액 — 연동 시에만 노출 (잔액 부족이 대량 발주실패의 원인)
    ...(providerBalance !== null
      ? [
          {
            label: "도매 잔액",
            value: `$${providerBalance.toFixed(2)}`,
            accent: providerBalance < 5 ? "red" : providerBalance < 20 ? "orange" : "green",
            sub: providerBalance < 5 ? "충전 필요" : undefined,
          } as Stat,
        ]
      : []),
  ];

  const charges: PendingCharge[] = pending.map((c) => ({
    id: c.id,
    amount: c.amount,
    total: c.total,
    depositorName: c.depositorName,
    receiptType: c.receiptType,
    receiptDetail: c.receiptDetail,
    username: c.user.username,
    name: c.user.name,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-navy">대시보드</h1>
        <DashboardStats stats={stats} />
      </div>

      <RevenueChart days={revenueDays} total={revenueTotal} />

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-navy">충전 입금 확인</h2>
        <p className="text-base text-gray">
          입금 대기 <span className="font-semibold text-orange">{pendingCount}</span>건{pendingCount > charges.length && ` (${charges.length}건 표시)`} · 처리완료{" "}
          {confirmedCount}건
        </p>
      </div>
      <AdminCharges charges={charges} />

      {/* 최근 처리 내역 */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-navy">최근 처리 내역</h2>
        <div className="overflow-hidden rounded-xl border border-line bg-white">
          {processed.length === 0 ? (
            <p className="p-6 text-base text-gray">처리된 내역이 없습니다.</p>
          ) : (
            processed.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-4 border-b border-line px-6 py-3.5 text-sm last:border-0"
              >
                <span className="text-navy">
                  <span className="font-medium">{c.user.name}</span>{" "}
                  <span className="text-gray">(@{c.user.username})</span> · 입금자{" "}
                  {c.depositorName} · {won(c.amount)}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-gray">
                    {c.updatedAt.toISOString().slice(0, 10).replace(/-/g, ".")}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      c.status === "CONFIRMED"
                        ? "bg-blue/10 text-blue"
                        : "bg-soft text-gray"
                    }`}
                  >
                    {c.status === "CONFIRMED" ? "충전완료" : "취소"}
                  </span>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <AdminMessage />
    </div>
  );
}
