import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import AdminOrders, { type AdminOrder } from "@/components/admin/AdminOrders";
import { failedDispatchFilter } from "@/lib/order-filters";

const STATUSES = ["PENDING_PAYMENT", "PAID", "PROCESSING", "COMPLETED", "CANCELLED"] as const;
const PAGE_SIZE = 50;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string; filter?: string }>;
}) {
  const { status, q, page, filter } = await searchParams;
  const query = q?.trim() ?? "";
  // 발주실패 필터: 발주 시도했으나 도매 주문번호 없이 에러 기록됨 + 아직 진행 가능 상태
  const failedOnly = filter === "failed";
  const activeStatus = failedOnly
    ? "FAILED"
    : STATUSES.includes(status as never)
      ? status!
      : "ALL";
  const pageNum = Math.max(1, Number(page) || 1);

  const searchOr = query
    ? [
        { orderNo: { contains: query, mode: "insensitive" as const } },
        { user: { username: { contains: query, mode: "insensitive" as const } } },
        { user: { name: { contains: query, mode: "insensitive" as const } } },
        { items: { some: { productName: { contains: query, mode: "insensitive" as const } } } },
      ]
    : undefined;

  const failedFilter: Prisma.OrderWhereInput = failedDispatchFilter();

  const where: Prisma.OrderWhereInput = {
    ...(failedOnly ? failedFilter : activeStatus !== "ALL" ? { status: activeStatus as never } : {}),
    ...(searchOr ? { OR: searchOr } : {}),
  };

  // 상태별 건수(검색어 반영) + 페이지 데이터 + 발주실패 건수
  const [rows, filteredCount, grouped, failedCount] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { username: true, name: true } },
        items: {
          take: 1,
          select: {
            productName: true,
            quantity: true,
            targetUrl: true,
            providerOrderId: true,
            providerStatus: true,
            providerRemains: true,
            providerError: true,
            product: { select: { providerServiceId: true } },
          },
        },
      },
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
      where: searchOr ? { OR: searchOr } : {},
    }),
    prisma.order.count({
      where: { ...failedFilter, ...(searchOr ? { OR: searchOr } : {}) },
    }),
  ]);

  const countByStatus: Record<string, number> = {};
  let allCount = 0;
  for (const g of grouped) {
    countByStatus[g.status] = g._count.id;
    allCount += g._count.id;
  }

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
    providerOrderId: o.items[0]?.providerOrderId ?? null,
    providerStatus: o.items[0]?.providerStatus ?? null,
    providerRemains: o.items[0]?.providerRemains ?? null,
    providerError: o.items[0]?.providerError ?? null,
    providerLinked: o.items[0]?.product?.providerServiceId != null,
    adminMemo: o.adminMemo ?? "",
    createdAt: o.createdAt.toISOString(),
  }));

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

  return (
    <AdminOrders
      orders={orders}
      activeStatus={activeStatus}
      query={query}
      allCount={allCount}
      countByStatus={countByStatus}
      filteredCount={filteredCount}
      failedCount={failedCount}
      page={pageNum}
      totalPages={totalPages}
    />
  );
}
