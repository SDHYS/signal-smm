import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const q = await prisma.inquiry.findUnique({
    where: { id },
    select: {
      userId: true,
      title: true,
      content: true,
      status: true,
      answer: true,
      answeredAt: true,
      createdAt: true,
    },
  });
  if (!q) notFound();
  // 본인 또는 관리자만
  if (q.userId !== user.id && user.role !== "ADMIN") notFound();

  const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, ".");

  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-8 pt-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              q.status === "ANSWERED" ? "bg-blue text-white" : "bg-soft text-gray"
            }`}
          >
            {q.status === "ANSWERED" ? "답변완료" : "답변대기"}
          </span>
          <span className="text-sm text-gray">{fmt(q.createdAt)}</span>
        </div>
        <h1 className="text-xl font-bold leading-7 sm:text-[26px] sm:leading-9 lg:text-[28px] lg:leading-[38px] text-navy">{q.title}</h1>
      </div>

      <div className="whitespace-pre-line border-y border-line py-8 text-base leading-[26px] text-gray">
        {q.content}
      </div>

      {q.status === "ANSWERED" && q.answer && (
        <div className="flex flex-col gap-3 rounded-xl bg-soft p-8">
          <p className="text-lg font-semibold text-navy">관리자 답변</p>
          <p className="whitespace-pre-line text-base leading-[26px] text-gray">{q.answer}</p>
          {q.answeredAt && (
            <p className="text-sm text-gray">{fmt(q.answeredAt)}</p>
          )}
        </div>
      )}

      <Link
        href="/inquiry"
        className="self-center rounded-lg bg-orange px-10 py-4 text-center text-base font-medium text-white"
      >
        목록으로
      </Link>
    </div>
  );
}
