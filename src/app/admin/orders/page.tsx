import { prisma } from "@/lib/prisma";
import AdminOrders, { type AdminOrder } from "@/components/admin/AdminOrders";

export default async function AdminOrdersPage() {
  const rows = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { username: true, name: true } },
      items: { take: 1, select: { productName: true, quantity: true, targetUrl: true } },
    },
  });

  const orders: AdminOrder[] = rows.map((o) => ({
    id: o.id,
    orderNo: o.orderNo,
    status: o.status,
    total: o.totalAmount,
    userName: o.user.name,
    username: o.user.username,
    productName: o.items[0]?.productName ?? "주문",
    quantity: o.items[0]?.quantity ?? 0,
    targetUrl: o.items[0]?.targetUrl ?? null,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-navy">주문 관리</h1>
        <p className="text-base text-gray">최근 주문 {orders.length}건</p>
      </div>
      <AdminOrders orders={orders} />
    </div>
  );
}
