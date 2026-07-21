"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { rateLimit, RATE_LIMITED_MSG } from "@/lib/ratelimit";
import { overLen, LIMITS } from "@/lib/validate";

export type Result = { ok: boolean; error?: string };

export async function markNotificationRead(id: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };
  // 본인 알림만
  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { read: true },
  });
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });
  return { ok: true };
}

// 관리자 → 회원 쪽지
export async function sendMessage(input: {
  username: string;
  body: string;
}): Promise<Result> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return { ok: false, error: "권한이 없습니다." };

  // 관리자 쪽지 과도 발송/스팸 방지 (분당 30건)
  if (!(await rateLimit("send-message", { max: 30, windowMs: 60_000, key: admin.id })))
    return { ok: false, error: RATE_LIMITED_MSG };

  const username = input.username?.trim();
  const body = input.body?.trim();
  if (!username || !body)
    return { ok: false, error: "받는 회원 아이디와 내용을 입력해주세요." };
  if (overLen(body, LIMITS.message)) return { ok: false, error: "쪽지가 너무 깁니다." };

  const target = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  if (!target) return { ok: false, error: "해당 아이디의 회원이 없습니다." };

  await notify(target.id, { type: "message", title: "관리자 쪽지", body });
  return { ok: true };
}
