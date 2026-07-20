import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import ChargesManager, { type AdminCharge } from "@/components/admin/ChargesManager";

const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"] as const;
const PAGE_SIZE = 50;

export default async function AdminChargesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status, q, page } = await searchParams;
  const query = q?.trim() ?? "";
  const activeStatus = STATUSES.includes(status as never) ? status! : "ALL";
  const pageNum = Math.max(1, Number(page) || 1);

  const searchOr = query
    ? [
        { depositorName: { contains: query, mode: "insensitive" as const } },
        { user: { username: { contains: query, mode: "insensitive" as const } } },
        { user: { name: { contains: query, mode: "insensitive" as const } } },
      ]
    : undefined;

  const where: Prisma.ChargeRequestWhereInput = {
    ...(activeStatus !== "ALL" ? { status: activeStatus as never } : {}),
    ...(searchOr ? { OR: searchOr } : {}),
  };

  const [rows, filteredCount, grouped] = await Promise.all([
    prisma.chargeRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { username: true, name: true } } },
    }),
    prisma.chargeRequest.count({ where }),
    prisma.chargeRequest.groupBy({
      by: ["status"],
      _count: { id: true },
      where: searchOr ? { OR: searchOr } : {},
    }),
  ]);

  const countByStatus: Record<string, number> = {};
  let allCount = 0;
  for (const g of grouped) {
    countByStatus[g.status] = g._count.id;
    allCount += g._count.id;
  }

  const charges: AdminCharge[] = rows.map((c) => ({
    id: c.id,
    amount: c.amount,
    total: c.total,
    depositorName: c.depositorName,
    receiptType: c.receiptType,
    status: c.status,
    username: c.user.username,
    name: c.user.name,
    createdAt: c.createdAt.toISOString(),
    confirmedAt: c.confirmedAt?.toISOString() ?? null,
  }));

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

  return (
    <ChargesManager
      charges={charges}
      activeStatus={activeStatus}
      query={query}
      allCount={allCount}
      countByStatus={countByStatus}
      filteredCount={filteredCount}
      page={pageNum}
      totalPages={totalPages}
    />
  );
}
