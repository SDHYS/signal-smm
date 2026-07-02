"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

export type ActionResult = { ok: boolean; error?: string; id?: string };

const VAT_RATE = 0.1;

export async function createChargeRequest(input: {
  amount: number;
  depositorName: string;
  receiptType?: string;
  receiptDetail?: Record<string, string>;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const amount = Math.floor(input.amount);
  if (!amount || amount <= 0)
    return { ok: false, error: "충전 금액을 선택해주세요." };

  const depositorName = input.depositorName?.trim() ?? "";
  if (!depositorName) return { ok: false, error: "입금자명을 입력해주세요." };

  const vat = Math.round(amount * VAT_RATE);
  const total = amount + vat;

  // 영수증 상세: 빈 값 제거 후 저장
  const detailEntries = Object.entries(input.receiptDetail ?? {}).filter(
    ([, v]) => v?.trim(),
  );
  const receiptDetail =
    detailEntries.length > 0 ? JSON.stringify(Object.fromEntries(detailEntries)) : null;

  const cr = await prisma.chargeRequest.create({
    data: {
      userId: user.id,
      amount,
      vat,
      total,
      depositorName,
      receiptType: input.receiptType || "신청안함",
      receiptDetail,
    },
    select: { id: true },
  });

  revalidatePath("/charge");
  return { ok: true, id: cr.id };
}

// ── 사용자: 본인 입금대기 신청 취소 ───────────────────
export async function cancelMyCharge(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const updated = await prisma.chargeRequest.updateMany({
    where: { id, userId: user.id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
  if (updated.count === 0)
    return { ok: false, error: "취소할 수 없는 신청입니다." };

  revalidatePath("/charge");
  revalidatePath("/admin");
  return { ok: true };
}

// ── 관리자: 입금 확인 → 잔액 반영 ─────────────────────
export async function confirmCharge(id: string): Promise<ActionResult> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return { ok: false, error: "권한이 없습니다." };

  const cr = await prisma.chargeRequest.findUnique({ where: { id } });
  if (!cr || cr.status !== "PENDING")
    return { ok: false, error: "이미 처리됐거나 존재하지 않는 신청입니다." };

  await prisma.$transaction([
    prisma.chargeRequest.update({
      where: { id },
      data: { status: "CONFIRMED", confirmedById: admin.id, confirmedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: cr.userId },
      data: { balance: { increment: cr.amount } },
    }),
  ]);

  await notify(cr.userId, {
    type: "charge",
    title: `충전 완료 — ${cr.amount.toLocaleString()}원이 잔액에 반영되었습니다.`,
    link: "/charge",
  });

  revalidatePath("/admin");
  revalidatePath("/charge");
  return { ok: true };
}

export async function cancelCharge(id: string): Promise<ActionResult> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return { ok: false, error: "권한이 없습니다." };

  const cr = await prisma.chargeRequest.findUnique({ where: { id } });
  if (!cr || cr.status !== "PENDING")
    return { ok: false, error: "처리할 수 없는 신청입니다." };

  await prisma.chargeRequest.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  await notify(cr.userId, {
    type: "charge",
    title: `충전 신청(${cr.amount.toLocaleString()}원)이 취소되었습니다.`,
    link: "/charge",
  });

  revalidatePath("/admin");
  revalidatePath("/charge");
  return { ok: true };
}
