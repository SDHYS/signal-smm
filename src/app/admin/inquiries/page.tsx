import { prisma } from "@/lib/prisma";
import AdminInquiries, { type AdminInquiry, type UserContext } from "@/components/admin/AdminInquiries";

export default async function AdminInquiriesPage() {
  const rows = await prisma.inquiry.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { user: { select: { id: true, username: true, name: true, balance: true } } },
  });

  // 문의자 회원 컨텍스트를 배치 조회 (N+1 방지) — 답변 시 잔액·주문·충전 상황을 함께 제공
  const userIds = [...new Set(rows.map((q) => q.user.id))];
  const [orderAgg, chargeAgg, pendingCharges] = await Promise.all([
    prisma.order.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, status: { not: "CANCELLED" } },
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
    prisma.chargeRequest.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, status: "CONFIRMED" },
      _sum: { amount: true },
    }),
    prisma.chargeRequest.groupBy({
      by: ["userId"],
      where: { userId: { in: userIds }, status: "PENDING" },
      _count: { id: true },
    }),
  ]);

  const orderMap = new Map(orderAgg.map((o) => [o.userId, o]));
  const chargeMap = new Map(chargeAgg.map((c) => [c.userId, c._sum.amount ?? 0]));
  const pendingMap = new Map(pendingCharges.map((c) => [c.userId, c._count.id]));

  const inquiries: AdminInquiry[] = rows.map((q) => {
    const o = orderMap.get(q.user.id);
    const ctx: UserContext = {
      balance: q.user.balance,
      orderCount: o?._count.id ?? 0,
      spent: o?._sum.totalAmount ?? 0,
      chargedTotal: chargeMap.get(q.user.id) ?? 0,
      pendingCharges: pendingMap.get(q.user.id) ?? 0,
    };
    return {
      id: q.id,
      title: q.title,
      content: q.content,
      userName: q.user.name,
      username: q.user.username,
      status: q.status,
      answer: q.answer,
      date: q.createdAt.toISOString().slice(0, 10).replace(/-/g, "."),
      ctx,
    };
  });

  return <AdminInquiries inquiries={inquiries} />;
}
