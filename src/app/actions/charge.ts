"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { rateLimit, RATE_LIMITED_MSG } from "@/lib/ratelimit";
import { getVatRate } from "@/lib/settings";
import { logAdmin } from "@/lib/audit";

export type ActionResult = { ok: boolean; error?: string; id?: string; total?: number };

const MAX_CHARGE = 10_000_000; // 1회 최대 충전 금액

export async function createChargeRequest(input: {
  amount: number;
  depositorName: string;
  receiptType?: string;
  receiptDetail?: Record<string, string>;
  clientKey?: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  if (!(await rateLimit("charge", { max: 5, windowMs: 60_000, key: user.id })))
    return { ok: false, error: RATE_LIMITED_MSG };

  // 멱등성: 같은 clientKey면 이미 만든 신청을 그대로 반환 (따닥/재제출 시 이중 신청 방지)
  const clientKey = input.clientKey?.trim() || null;
  if (clientKey) {
    const dup = await prisma.chargeRequest.findUnique({
      where: { clientKey },
      select: { id: true, userId: true, total: true },
    });
    if (dup) {
      if (dup.userId !== user.id) return { ok: false, error: "잘못된 요청입니다." };
      return { ok: true, id: dup.id, total: dup.total };
    }
  }

  const amount = Math.floor(input.amount);
  if (!Number.isSafeInteger(amount) || amount <= 0)
    return { ok: false, error: "충전 금액을 선택해주세요." };
  if (amount > MAX_CHARGE)
    return {
      ok: false,
      error: `1회 최대 충전 금액은 ${MAX_CHARGE.toLocaleString()}원입니다.`,
    };

  const depositorName = input.depositorName?.trim() ?? "";
  if (!depositorName) return { ok: false, error: "입금자명을 입력해주세요." };

  const vat = Math.round((amount * (await getVatRate())) / 100);
  const total = amount + vat;

  // 영수증 상세: 빈 값 제거 후 저장
  const detailEntries = Object.entries(input.receiptDetail ?? {}).filter(
    ([, v]) => v?.trim(),
  );
  const receiptDetail =
    detailEntries.length > 0 ? JSON.stringify(Object.fromEntries(detailEntries)) : null;

  let cr: { id: string };
  try {
    cr = await prisma.chargeRequest.create({
      data: {
        clientKey,
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
  } catch (e) {
    // 동시 제출로 같은 clientKey가 먼저 커밋된 경우(P2002) → 기존 신청 반환
    if ((e as { code?: string })?.code === "P2002" && clientKey) {
      const dup = await prisma.chargeRequest.findUnique({
        where: { clientKey },
        select: { id: true, userId: true },
      });
      if (dup?.userId === user.id) return { ok: true, id: dup.id };
    }
    console.error("createChargeRequest failed", e);
    return { ok: false, error: "충전 신청 처리 중 오류가 발생했습니다." };
  }

  revalidatePath("/charge");
  // total 을 서버 진실값으로 반환 — 유저가 세션 중 부가세율 변경돼도 표시=저장 금액 일치
  return { ok: true, id: cr.id, total };
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
// opts.creditAmount: 실제 입금액이 신청액과 다를 때 적립할 실제 금액(부분입금).
// 미지정이면 신청 amount 그대로 적립.
export async function confirmCharge(
  id: string,
  opts?: { creditAmount?: number; reason?: string },
): Promise<ActionResult> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return { ok: false, error: "권한이 없습니다." };

  const cr = await prisma.chargeRequest.findUnique({ where: { id } });
  if (!cr) return { ok: false, error: "존재하지 않는 신청입니다." };

  // 적립액 결정: 부분입금이면 관리자가 실제 적립할 금액을 지정.
  const partial = opts?.creditAmount != null && Math.floor(opts.creditAmount) !== cr.amount;
  const credit = partial ? Math.floor(opts!.creditAmount!) : cr.amount;
  if (!Number.isSafeInteger(credit) || credit <= 0)
    return { ok: false, error: "적립 금액이 올바르지 않습니다." };
  if (credit > MAX_CHARGE)
    return { ok: false, error: "적립 금액이 한도를 초과했습니다." };

  try {
    await prisma.$transaction(async (tx) => {
      // PENDING → CONFIRMED 전환을 원자적으로 선점 — 동시 클릭해도 잔액은 1번만 반영
      const upd = await tx.chargeRequest.updateMany({
        where: { id, status: "PENDING" },
        data: {
          status: "CONFIRMED",
          confirmedById: admin.id,
          confirmedAt: new Date(),
        },
      });
      if (upd.count === 0) throw new Error("ALREADY_HANDLED");

      await tx.user.update({
        where: { id: cr.userId },
        data: { balance: { increment: credit } },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "ALREADY_HANDLED")
      return { ok: false, error: "이미 처리된 신청입니다." };
    console.error("confirmCharge failed", e);
    return { ok: false, error: "입금 확인 처리 중 오류가 발생했습니다." };
  }

  await notify(cr.userId, {
    type: "charge",
    title: `충전 완료 — ${credit.toLocaleString()}원이 잔액에 반영되었습니다.`,
    link: "/charge",
  });

  await logAdmin({
    action: partial ? "charge.confirm.partial" : "charge.confirm",
    targetType: "charge",
    targetId: cr.id,
    targetLabel: `${cr.depositorName} · 신청 ${cr.amount.toLocaleString()}원`,
    amount: credit,
    reason: opts?.reason ?? (partial ? `부분입금: 신청 ${cr.amount.toLocaleString()}원 → 적립 ${credit.toLocaleString()}원` : null),
    admin: { id: admin.id, name: admin.name },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/charges");
  revalidatePath("/charge");
  return { ok: true };
}

// ── 관리자: 여러 입금대기 신청 일괄 확인 ───────────────
export async function confirmChargesBulk(
  ids: string[],
): Promise<{ ok: boolean; confirmed: number; failed: number; error?: string }> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return { ok: false, confirmed: 0, failed: 0, error: "권한이 없습니다." };
  if (!Array.isArray(ids) || ids.length === 0)
    return { ok: false, confirmed: 0, failed: 0, error: "선택된 신청이 없습니다." };
  // 조용한 잘림 방지 — 초과 선택은 거부해서 미처리분이 '처리됨'으로 오인되지 않게
  if (ids.length > 200)
    return {
      ok: false,
      confirmed: 0,
      failed: 0,
      error: "한 번에 최대 200건까지 처리할 수 있습니다. 나눠서 진행해주세요.",
    };

  let confirmed = 0;
  let failed = 0;
  // 각 건을 독립 처리 — 한 건 실패가 나머지를 막지 않도록 순차 처리(원자성은 confirmCharge 내부 보장)
  for (const id of ids) {
    const res = await confirmCharge(id);
    if (res.ok) confirmed++;
    else failed++;
  }

  revalidatePath("/admin");
  revalidatePath("/admin/charges");
  return { ok: true, confirmed, failed };
}

export async function cancelCharge(id: string): Promise<ActionResult> {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return { ok: false, error: "권한이 없습니다." };

  const cr = await prisma.chargeRequest.findUnique({ where: { id } });
  if (!cr) return { ok: false, error: "존재하지 않는 신청입니다." };

  const upd = await prisma.chargeRequest.updateMany({
    where: { id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
  if (upd.count === 0) return { ok: false, error: "이미 처리된 신청입니다." };

  await notify(cr.userId, {
    type: "charge",
    title: `충전 신청(${cr.amount.toLocaleString()}원)이 취소되었습니다.`,
    link: "/charge",
  });

  await logAdmin({
    action: "charge.cancel",
    targetType: "charge",
    targetId: cr.id,
    targetLabel: `${cr.depositorName} · ${cr.amount.toLocaleString()}원`,
    amount: cr.amount,
    admin: { id: admin.id, name: admin.name },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/charges");
  revalidatePath("/charge");
  return { ok: true };
}
