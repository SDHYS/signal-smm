"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

export type Result = { ok: boolean; error?: string; id?: string };

export async function createInquiry(input: {
  title: string;
  content: string;
}): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };
  if (!input.title.trim() || !input.content.trim())
    return { ok: false, error: "제목과 내용을 입력해주세요." };

  const q = await prisma.inquiry.create({
    data: {
      userId: user.id,
      title: input.title.trim(),
      content: input.content.trim(),
    },
    select: { id: true },
  });
  revalidatePath("/inquiry");
  revalidatePath("/admin/inquiries");
  return { ok: true, id: q.id };
}

export async function answerInquiry(id: string, answer: string): Promise<Result> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return { ok: false, error: "권한이 없습니다." };
  if (!answer.trim()) return { ok: false, error: "답변 내용을 입력해주세요." };

  const updated = await prisma.inquiry.update({
    where: { id },
    data: {
      answer: answer.trim(),
      status: "ANSWERED",
      answeredById: admin.id,
      answeredAt: new Date(),
    },
    select: { userId: true, title: true },
  });

  await notify(updated.userId, {
    type: "inquiry",
    title: `1:1 문의 "${updated.title}"에 답변이 등록되었습니다.`,
    link: `/inquiry/${id}`,
  });

  revalidatePath("/admin/inquiries");
  revalidatePath(`/inquiry/${id}`);
  revalidatePath("/inquiry");
  return { ok: true };
}
