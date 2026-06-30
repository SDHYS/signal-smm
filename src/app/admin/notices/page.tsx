import { prisma } from "@/lib/prisma";
import AdminNotices, { type NoticeItem } from "@/components/admin/AdminNotices";

export default async function AdminNoticesPage() {
  const rows = await prisma.notice.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, title: true, views: true, createdAt: true },
  });

  const notices: NoticeItem[] = rows.map((n) => ({
    id: n.id,
    title: n.title,
    views: n.views,
    date: n.createdAt.toISOString().slice(0, 10).replace(/-/g, "."),
  }));

  return <AdminNotices notices={notices} />;
}
