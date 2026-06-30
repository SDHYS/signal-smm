"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type Result = { ok: boolean; error?: string; id?: string };

export async function createBlogPost(input: {
  category: string;
  title: string;
  content: string;
  tags?: string[];
}): Promise<Result> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return { ok: false, error: "권한이 없습니다." };
  if (!input.title.trim() || !input.content.trim())
    return { ok: false, error: "제목과 내용을 입력해주세요." };

  const p = await prisma.blogPost.create({
    data: {
      category: input.category || "업데이트",
      title: input.title.trim(),
      content: input.content.trim(),
      tags: input.tags ?? [],
      authorName: admin.name,
    },
    select: { id: true },
  });
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return { ok: true, id: p.id };
}

export async function deleteBlogPost(id: string): Promise<Result> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return { ok: false, error: "권한이 없습니다." };
  await prisma.blogPost.delete({ where: { id } });
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return { ok: true };
}
