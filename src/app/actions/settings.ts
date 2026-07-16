"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { SETTING_KEYS } from "@/lib/settings";

export async function updateSettings(
  input: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return { ok: false, error: "권한이 없습니다." };

  const entries = Object.entries(input).filter(([k]) =>
    (SETTING_KEYS as readonly string[]).includes(k),
  );

  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    ),
  );

  revalidatePath("/admin/settings");
  revalidatePath("/charge");
  revalidatePath("/support");
  revalidatePath("/about");
  revalidatePath("/", "layout"); // 사이트명은 레이아웃(사이드바/상단바)에도 반영
  return { ok: true };
}
