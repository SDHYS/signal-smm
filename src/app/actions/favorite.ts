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
    await prisma.favorite.create({ data: { userId: user.id, productId } });
    active = true;
  }

  revalidatePath("/");
  return { ok: true, active };
}
