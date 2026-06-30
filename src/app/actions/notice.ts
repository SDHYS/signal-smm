"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type Result = { ok: boolean; error?: string; id?: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function createNotice(input: {
  title: string;
  content: string;
  pinned?: boolean;
}): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "권한이 없습니다." };
  if (!input.title.trim() || !input.content.trim())
    return { ok: false, error: "제목과 내용을 입력해주세요." };

  const n = await prisma.notice.create({
    data: {
      title: input.title.trim(),
      content: input.content.trim(),
      pinned: input.pinned ?? false,
      authorName: admin.name,
    },
    select: { id: true },
  });
  revalidatePath("/notice");
  revalidatePath("/admin/notices");
  return { ok: true, id: n.id };
}

export async function deleteNotice(id: string): Promise<Result> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "권한이 없습니다." };
  await prisma.notice.delete({ where: { id } });
  revalidatePath("/notice");
  revalidatePath("/admin/notices");
  return { ok: true };
}
