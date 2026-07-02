import { prisma } from "@/lib/prisma";
import AdminCharges, { type PendingCharge } from "@/components/admin/AdminCharges";

export default async function AdminPage() {
  const [pending, confirmedCount] = await Promise.all([
    prisma.chargeRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { user: { select: { username: true, name: true } } },
    }),
    prisma.chargeRequest.count({ where: { status: "CONFIRMED" } }),
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
    </div>
  );
}
