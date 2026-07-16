"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

export type Result = { ok: boolean; error?: string; data?: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  return user && user.role === "ADMIN" ? user : null;
}

// 잔액 수동 조정 (양수=증액, 음수=차감)
export async function adjustBalance(userId: string, delta: number): Promise<Result> {
  if (!(await requireAdmin())) return { ok: false, error: "권한이 없습니다." };

  if (!Number.isFinite(delta))
    return { ok: false, error: "조정 금액이 올바르지 않습니다." };
  const amount = Math.trunc(delta);
  if (!amount) return { ok: false, error: "조정 금액을 입력해주세요." };

  if (amount < 0) {
    // 차감은 잔액이 충분할 때만 (음수 잔액 방지)
    const dec = await prisma.user.updateMany({
      where: { id: userId, balance: { gte: -amount } },
      data: { balance: { increment: amount } },
    });
    if (dec.count === 0)
      return { ok: false, error: "잔액이 부족해 차감할 수 없습니다." };
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } },
    });
  }

  await notify(userId, {
    type: "charge",
    title: `관리자가 잔액을 ${amount > 0 ? "+" : ""}${amount.toLocaleString()}원 조정했습니다.`,
    link: "/charge",
  });

  revalidatePath("/admin/members");
  return { ok: true };
}

// 비밀번호 초기화 → 임시 비밀번호를 관리자에게 1회 표시
export async function resetPassword(userId: string): Promise<Result> {
  if (!(await requireAdmin())) return { ok: false, error: "권한이 없습니다." };

  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const temp = Array.from(
    { length: 10 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(temp, 10) },
  });

  await notify(userId, {
    type: "message",
    title: "비밀번호가 초기화되었습니다. 로그인 후 마이페이지에서 변경해주세요.",
    link: "/mypage",
  });

  return { ok: true, data: temp };
}
