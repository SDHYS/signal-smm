"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/session";
import { rateLimit, RATE_LIMITED_MSG } from "@/lib/ratelimit";

export type ActionResult = { ok: boolean; error?: string };

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignupInput = {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  signupChannel?: string | null;
};

export async function signupAction(input: SignupInput): Promise<ActionResult> {
  if (!(await rateLimit("signup", { max: 5, windowMs: 10 * 60_000 })))
    return { ok: false, error: RATE_LIMITED_MSG };

  const username = input.username?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";
  const { password, passwordConfirm } = input;

  // 유효성 검사
  if (username.length < 3) return { ok: false, error: "아이디는 3자 이상이어야 합니다." };
  if (!emailRe.test(email)) return { ok: false, error: "이메일 형식이 올바르지 않습니다." };
  if (!password || password.length < 8)
    return { ok: false, error: "비밀번호는 8자 이상이어야 합니다." };
  if (password !== passwordConfirm)
    return { ok: false, error: "비밀번호가 일치하지 않습니다." };

  // 중복 검사
  const exists = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
    select: { username: true, email: true },
  });
  if (exists) {
    return {
      ok: false,
      error: exists.username === username ? "이미 사용 중인 아이디입니다." : "이미 가입된 이메일입니다.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      name: username,
      signupChannel: input.signupChannel ?? null,
    },
    select: { id: true },
  });

  await createSession(user.id);
  return { ok: true };
}

export async function loginAction(input: {
  username: string;
  password: string;
  keepLogin?: boolean;
}): Promise<ActionResult> {
  const username = input.username?.trim() ?? "";
  if (!username || !input.password)
    return { ok: false, error: "아이디와 비밀번호를 입력해주세요." };

  // IP 기준 + 계정 기준 이중 제한 (무차별 대입 방어)
  if (
    !(await rateLimit("login-ip", { max: 10, windowMs: 60_000 })) ||
    !(await rateLimit("login-user", { max: 5, windowMs: 60_000, key: username }))
  )
    return { ok: false, error: RATE_LIMITED_MSG };

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, passwordHash: true },
  });
  // 사용자 없음/비번 불일치 모두 동일 메시지 (계정 존재 노출 방지)
  const valid = user && (await bcrypt.compare(input.password, user.passwordHash));
  if (!user || !valid)
    return { ok: false, error: "아이디 또는 비밀번호가 올바르지 않습니다." };

  await createSession(user.id, input.keepLogin ?? false);
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
}
