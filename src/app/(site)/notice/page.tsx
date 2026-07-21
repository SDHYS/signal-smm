import NoticeBoard from "@/components/notice/NoticeBoard";
import { prisma } from "@/lib/prisma";

import { getCopy } from "@/lib/copy";

export default async function NoticePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const where = q?.trim()
    ? { title: { contains: q.trim(), mode: "insensitive" as const } }
    : {};

  const copy = await getCopy();
  const [notices, total] = await Promise.all([
    prisma.notice.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 50,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.notice.count({ where }),
  ]);

  return (
    <NoticeBoard eyebrow={copy.notice_eyebrow}
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
