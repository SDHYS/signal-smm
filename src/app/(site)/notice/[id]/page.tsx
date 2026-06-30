import { notFound } from "next/navigation";
import NoticeDetail from "@/components/notice/NoticeDetail";
import { prisma } from "@/lib/prisma";

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const notice = await prisma.notice
    .update({
      where: { id },
      data: { views: { increment: 1 } },
      select: {
        title: true,
        content: true,
        authorName: true,
        views: true,
        createdAt: true,
      },
    })
    .catch(() => null);

  if (!notice) notFound();

  return (
    <NoticeDetail
      notice={{
        title: notice.title,
        content: notice.content,
        authorName: notice.authorName,
        views: notice.views,
        date: notice.createdAt.toISOString().slice(0, 10).replace(/-/g, "."),
      }}
    />
  );
}
