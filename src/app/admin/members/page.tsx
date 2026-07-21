import { prisma } from "@/lib/prisma";
import AdminMembers, { type MemberRow } from "@/components/admin/AdminMembers";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const where = q?.trim()
    ? {
        OR: [
          { username: { contains: q.trim(), mode: "insensitive" as const } },
          { name: { contains: q.trim(), mode: "insensitive" as const } },
          { email: { contains: q.trim(), mode: "insensitive" as const } },
        ],
      }
    : {};

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { _count: { select: { orders: true } } },
    }),
    // 검색 시 total이 전체 회원수가 아니라 '검색 결과 수'와 일치하도록 동일 where 적용
    prisma.user.count({ where }),
  ]);

  const members: MemberRow[] = rows.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    balance: u.balance,
    orderCount: u._count.orders,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));

  return <AdminMembers members={members} total={total} q={q} />;
}
