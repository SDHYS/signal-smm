import OrderHistory, {
  type OrderGroup,
} from "@/components/orders/OrderHistory";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCopy } from "@/lib/copy";

const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "입금대기",
  PAID: "결제완료",
  PROCESSING: "진행중",
  COMPLETED: "완료",
  CANCELLED: "환불",
};

function dateKey(d: Date) {
  return d.toISOString().slice(0, 10).replace(/-/g, ".");
}

function groupByDate(
  orders: {
    id: string;
    orderNo: string;
    status: string;
    totalAmount: number;
    createdAt: Date;
    items: { productName: string }[];
  }[],
): OrderGroup[] {
  const map = new Map<string, OrderGroup>();
  for (const o of orders) {
    const key = dateKey(o.createdAt);
    if (!map.has(key)) map.set(key, { date: key, orders: [] });
    map.get(key)!.orders.push({
      id: o.id,
      title: o.items[0]?.productName ?? "주문",
      status: STATUS_LABEL[o.status] ?? o.status,
      no: `#${o.orderNo}`,
      total: `${o.totalAmount.toLocaleString()}원`,
    });
  }
  return [...map.values()];
}

export default async function OrdersPage() {
  const [user, copy] = await Promise.all([getCurrentUser(), getCopy()]);
  // 최근 200건 상한 — 무제한 조회/DOM 폭발 방지 (그 이상은 추후 페이지네이션)
  const all = user
    ? await prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
          id: true,
          orderNo: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          items: { take: 1, select: { productName: true } },
        },
      })
    : [];

  const orders = all.filter((o) => o.status !== "CANCELLED");
  const refunds = all.filter((o) => o.status === "CANCELLED");

  return (
    <OrderHistory
      eyebrow={copy.orders_eyebrow}
      isLoggedIn={!!user}
      orderGroups={groupByDate(orders)}
      refundGroups={groupByDate(refunds)}
      orderTotal={orders.length}
      refundTotal={refunds.length}
    />
  );
}
