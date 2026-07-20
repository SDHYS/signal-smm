import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "charge.confirm"
  | "charge.confirm.partial"
  | "charge.cancel"
  | "order.refund"
  | "order.status"
  | "balance.adjust"
  | "password.reset"
  | "sync.refund";

export type AuditEntry = {
  action: AuditAction;
  targetType: "charge" | "order" | "user";
  targetId: string;
  targetLabel?: string | null;
  reason?: string | null;
  amount?: number | null;
  meta?: Record<string, unknown> | null;
  // 실행자. 생략 시 시스템(자동 처리)으로 기록.
  admin?: { id: string; name: string } | null;
};

// 감사 로그 기록 — best-effort. 로그 실패가 본 조치(환불/충전 등)를 되돌리면 안 되므로
// 절대 throw 하지 않고 콘솔 경고만 남긴다.
export async function logAdmin(entry: AuditEntry): Promise<void> {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId: entry.admin?.id ?? null,
        adminName: entry.admin?.name ?? "시스템",
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        targetLabel: entry.targetLabel ?? null,
        reason: entry.reason?.trim() || null,
        amount: entry.amount ?? null,
        meta: entry.meta ? JSON.stringify(entry.meta) : null,
      },
    });
  } catch (e) {
    console.error("logAdmin failed", { action: entry.action, targetId: entry.targetId }, e);
  }
}
