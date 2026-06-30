import { prisma } from "@/lib/prisma";
import AdminInquiries, { type AdminInquiry } from "@/components/admin/AdminInquiries";

export default async function AdminInquiriesPage() {
  const rows = await prisma.inquiry.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { user: { select: { username: true, name: true } } },
  });

  const inquiries: AdminInquiry[] = rows.map((q) => ({
    id: q.id,
    title: q.title,
    content: q.content,
    userName: q.user.name,
    username: q.user.username,
    status: q.status,
    answer: q.answer,
    date: q.createdAt.toISOString().slice(0, 10).replace(/-/g, "."),
  }));

  return <AdminInquiries inquiries={inquiries} />;
}
