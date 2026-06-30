import InquiryBoard, { type InquiryRow } from "@/components/inquiry/InquiryBoard";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function InquiryPage() {
  const user = await getCurrentUser();
  const rows = user
    ? await prisma.inquiry.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, createdAt: true },
      })
    : [];

  const inquiries: InquiryRow[] = rows.map((q, i) => ({
    id: q.id,
    no: rows.length - i,
    title: q.title,
    date: q.createdAt.toISOString().slice(0, 10).replace(/-/g, "."),
    answered: q.status === "ANSWERED",
  }));

  return <InquiryBoard isLoggedIn={!!user} inquiries={inquiries} />;
}
