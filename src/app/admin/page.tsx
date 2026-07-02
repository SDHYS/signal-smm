import { prisma } from "@/lib/prisma";
import AdminCharges, { type PendingCharge } from "@/components/admin/AdminCharges";
import AdminMessage from "@/components/admin/AdminMessage";

const won = (n: number) => `${n.toLocaleString()}원`;

export default async function AdminPage() {
  const [pending, confirmedCount, processed] = await Promise.all([
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
  ]);

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
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-navy">충전 입금 확인</h1>
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
