import NoticeBoard from "@/components/notice/NoticeBoard";
import { prisma } from "@/lib/prisma";

export default async function NoticePage() {
  const [notices, total] = await Promise.all([
    prisma.notice.findMany({
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 50,
      select: { id: true, title: true, createdAt: true },
    }),
    prisma.notice.count(),
  ]);

  return (
    <NoticeBoard
      total={total}
      notices={notices.map((n) => ({
        id: n.id,
        title: n.title,
        date: n.createdAt.toISOString().slice(0, 10).replace(/-/g, "."),
      }))}
    />
  );
}
