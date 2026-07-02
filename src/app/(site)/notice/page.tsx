import NoticeBoard from "@/components/notice/NoticeBoard";
import { prisma } from "@/lib/prisma";

export default async function NoticePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const where = q?.trim()
    ? { title: { contains: q.trim(), mode: "insensitive" as const } }
    : {};

  const [notices, total] = await Promise.all([
    prisma.notice.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 50,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.notice.count(),
  ]);

  return (
    <NoticeBoard
      total={total}
      q={q}
      notices={notices.map((n) => ({
        id: n.id,
        title: n.title,
        date: n.createdAt.toISOString().slice(0, 10).replace(/-/g, "."),
      }))}
    />
  );
}
