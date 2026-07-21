"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { SETTING_KEYS } from "@/lib/settings";
import { COPY_KEYS } from "@/lib/copy";
import { overLen, LIMITS } from "@/lib/validate";

export async function updateSettings(
  input: Record<string, string>,
): Promise<{ ok: boolean; error?: string }> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return { ok: false, error: "권한이 없습니다." };

  const entries = Object.entries(input).filter(
    ([k]) => (SETTING_KEYS as readonly string[]).includes(k) || COPY_KEYS.has(k),
  );
  // 값 길이 상한 — 약관/소개/문구 등 @db.Text 필드에 거대한 값 저장·렌더 DoS 방지
  if (entries.some(([, v]) => overLen(v, LIMITS.settingValue)))
    return { ok: false, error: "설정 값이 너무 깁니다." };

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
  revalidatePath("/admin/texts");
  revalidatePath("/charge");
  revalidatePath("/support");
  revalidatePath("/about");
  revalidatePath("/guide");
  revalidatePath("/terms");
  revalidatePath("/privacy");
  revalidatePath("/", "layout"); // 사이트명·문구는 레이아웃/전 페이지에 반영
  return { ok: true };
}
