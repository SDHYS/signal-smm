import { prisma } from "@/lib/prisma";
import AdminCharges, { type PendingCharge } from "@/components/admin/AdminCharges";
import AdminMessage from "@/components/admin/AdminMessage";
import DashboardStats, { type Stat } from "@/components/admin/DashboardStats";

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
    confirmedCount,
    processed,
    memberCount,
    todayOrders,
    todaySales,
    processingCount,
    pendingInquiries,
  ] = await Promise.all([
    prisma.chargeRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { username: true, name: true } } },
    }),
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
  ]);

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
      value: `${pending.length}건`,
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

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-navy">충전 입금 확인</h2>
        <p className="text-base text-gray">
          입금 대기 <span className="font-semibold text-orange">{charges.length}</span>건 · 처리완료{" "}
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
