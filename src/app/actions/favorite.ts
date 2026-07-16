"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function toggleFavorite(
  productId: string,
): Promise<{ ok: boolean; active?: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인 후 이용할 수 있습니다." };

  const deleted = await prisma.favorite.deleteMany({
    where: { userId: user.id, productId },
  });

  let active = false;
  if (deleted.count === 0) {
    try {
      await prisma.favorite.create({ data: { userId: user.id, productId } });
      active = true;
    } catch {
      // 상품이 삭제됐거나(FK) 동시 요청으로 이미 존재(unique) — 조용히 무시
      return { ok: false, error: "즐겨찾기할 수 없는 상품입니다." };
    }
  }

  revalidatePath("/");
  return { ok: true, active };
}
