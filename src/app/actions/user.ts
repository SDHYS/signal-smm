"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, RATE_LIMITED_MSG } from "@/lib/ratelimit";
import { overLen, LIMITS } from "@/lib/validate";

export type Result = { ok: boolean; error?: string; data?: string };

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateProfile(input: {
  name: string;
  phone?: string;
  email: string;
}): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  if (!name) return { ok: false, error: "이름을 입력해주세요." };
  if (overLen(name, LIMITS.shortText) || overLen(input.phone, LIMITS.phone) || overLen(email, LIMITS.email))
    return { ok: false, error: "입력이 너무 깁니다." };
  if (!emailRe.test(email))
    return { ok: false, error: "이메일 형식이 올바르지 않습니다." };

  // 본인 제외 이메일 중복 확인
  const dup = await prisma.user.findFirst({
    where: { email, id: { not: user.id } },
    select: { id: true },
  });
  if (dup) return { ok: false, error: "이미 사용 중인 이메일입니다." };

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { name, email, phone: input.phone?.trim() || null },
    });
  } catch (e) {
    // 동시 요청으로 같은 이메일이 먼저 저장된 경우(P2002) → 친절한 메시지(500 방지)
    if ((e as { code?: string })?.code === "P2002")
      return { ok: false, error: "이미 사용 중인 이메일입니다." };
    throw e;
  }

  revalidatePath("/mypage");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function changePassword(input: {
  current: string;
  next: string;
}): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };
  if (!input.next || input.next.length < 8)
    return { ok: false, error: "새 비밀번호는 8자 이상이어야 합니다." };
  if (input.next.length > LIMITS.password)
    return { ok: false, error: `비밀번호는 ${LIMITS.password}자 이하로 입력해주세요.` };

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  const valid = row && (await bcrypt.compare(input.current ?? "", row.passwordHash));
  if (!valid) return { ok: false, error: "현재 비밀번호가 올바르지 않습니다." };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(input.next, 10) },
  });
  return { ok: true };
}

// 아이디 찾기: 이메일 → 마스킹된 아이디
export async function findUsername(email: string): Promise<Result> {
  // 이메일 기반 계정 존재 열거 방지
  if (!(await rateLimit("find-id", { max: 5, windowMs: 10 * 60_000 })))
    return { ok: false, error: RATE_LIMITED_MSG };

  const normalized = email?.trim().toLowerCase();
  if (!emailRe.test(normalized ?? ""))
    return { ok: false, error: "이메일 형식이 올바르지 않습니다." };

  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { username: true },
  });
  if (!user)
    return { ok: false, error: "해당 이메일로 가입된 계정이 없습니다." };

  const u = user.username;
  const masked =
    u.length <= 3 ? `${u[0]}**` : `${u.slice(0, 2)}${"*".repeat(u.length - 3)}${u.slice(-1)}`;
  return { ok: true, data: masked };
}
