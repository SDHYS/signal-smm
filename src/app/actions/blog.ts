"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { overLen, LIMITS } from "@/lib/validate";

export type Result = { ok: boolean; error?: string; id?: string };

export async function createBlogPost(input: {
  category: string;
  title: string;
  content: string;
  tags?: string[];
  thumbnailUrl?: string;
}): Promise<Result> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return { ok: false, error: "권한이 없습니다." };
  if (!input.title.trim() || !input.content.trim())
    return { ok: false, error: "제목과 내용을 입력해주세요." };
  if (
    overLen(input.title, LIMITS.title) ||
    overLen(input.content, LIMITS.content) ||
    overLen(input.category, LIMITS.shortText) ||
    overLen(input.thumbnailUrl, LIMITS.url)
  )
    return { ok: false, error: "입력이 너무 깁니다." };
  // 태그: 개수·길이 상한 + 빈 값 제거
  const tags = (input.tags ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => !overLen(t, LIMITS.tag))
    .slice(0, LIMITS.tagCount);

  const p = await prisma.blogPost.create({
    data: {
      category: input.category || "업데이트",
      title: input.title.trim(),
      content: input.content.trim(),
      tags,
      thumbnailUrl: input.thumbnailUrl?.trim() || null,
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
  // 이미 삭제된 글(P2025) 재삭제해도 500 대신 성공 처리(멱등)
  await prisma.blogPost.delete({ where: { id } }).catch((e) => {
    if ((e as { code?: string })?.code !== "P2025") throw e;
  });
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  return { ok: true };
}
