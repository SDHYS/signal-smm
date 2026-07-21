"use client";

import { useState } from "react";
import { fmtKST } from "@/lib/datetime";
import { useRouter } from "next/navigation";
import { confirmCharge, cancelCharge } from "@/app/actions/charge";

export type PendingCharge = {
  id: string;
  amount: number;
  total: number;
  depositorName: string;
  receiptType: string;
  receiptDetail: string | null;
  username: string;
  name: string;
  createdAt: string;
};

function formatDetail(json: string | null): string | null {
  if (!json) return null;
  try {
    return Object.entries(JSON.parse(json) as Record<string, string>)
      .map(([k, v]) => `${k} ${v}`)
      .join(" · ");
  } catch {
    return null;
  }
}

const won = (n: number) => `${n.toLocaleString()}원`;

export default function AdminCharges({ charges }: { charges: PendingCharge[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(id: string, fn: typeof cancelCharge) {
    setBusy(id);
    setError(null);
    const res = await fn(id);
    setBusy(null);
    if (res.ok) router.refresh();
    else setError(res.error ?? "처리에 실패했습니다.");
  }

  async function confirm(id: string) {
    setBusy(id);
    setError(null);
    const res = await confirmCharge(id);
    setBusy(null);
    if (res.ok) router.refresh();
    else setError(res.error ?? "처리에 실패했습니다.");
  }

  // 부분입금: 신청액과 다른 실제 입금액을 관리자가 지정해 적립
  async function confirmPartial(c: PendingCharge) {
    const input = prompt(
      `부분입금 처리 — 실제 적립할 금액(원)을 입력하세요.\n신청 금액: ${c.amount.toLocaleString()}원`,
      String(c.amount),
    );
    if (input === null) return;
    const credit = Math.floor(Number(input.replace(/[^0-9]/g, "")));
    if (!credit || credit <= 0) {
      setError("적립 금액이 올바르지 않습니다.");
      return;
    }
    setBusy(c.id);
    setError(null);
    const res = await confirmCharge(c.id, { creditAmount: credit });
    setBusy(null);
    if (res.ok) router.refresh();
    else setError(res.error ?? "처리에 실패했습니다.");
  }

  if (charges.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-white p-8 text-base text-gray">
        입금 대기 중인 충전 신청이 없습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm font-medium text-[#ED1C24]">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <div className="min-w-[720px]">
        <div className="flex items-center bg-soft px-6 py-4 text-sm font-medium text-gray">
          <div className="w-[200px]">회원</div>
          <div className="flex-1">입금자명</div>
          <div className="w-[120px] text-right">충전금액</div>
          <div className="w-[140px] text-right">입금액</div>
          <div className="w-[180px]" />
        </div>
        {charges.map((c) => (
          <div key={c.id} className="flex items-center border-t border-line px-6 py-4 text-sm">
            <div className="flex w-[200px] flex-col">
              <span className="font-medium text-navy">{c.name}</span>
              <span className="text-gray">@{c.username}</span>
            </div>
            <div className="flex flex-1 flex-col">
              <span className="font-medium text-navy">{c.depositorName}</span>
              <span className="text-gray">
                {c.receiptType} · {fmtKST(c.createdAt)}
              </span>
              {formatDetail(c.receiptDetail) && (
                <span className="text-xs text-gray">{formatDetail(c.receiptDetail)}</span>
              )}
            </div>
            <div className="w-[120px] text-right font-medium text-navy">{won(c.amount)}</div>
            <div className="w-[140px] text-right font-semibold text-orange">{won(c.total)}</div>
            <div className="flex w-[180px] items-center justify-end gap-2">
              <button
                onClick={() => run(c.id, cancelCharge)}
                disabled={busy === c.id}
                className="rounded border border-line px-3 py-2 text-xs font-medium text-gray transition hover:bg-soft disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={() => confirmPartial(c)}
                disabled={busy === c.id}
                className="rounded border border-line px-3 py-2 text-xs font-medium text-navy transition hover:bg-soft disabled:opacity-50"
                title="실제 입금액이 신청액과 다를 때"
              >
                부분입금
              </button>
              <button
                onClick={() => confirm(c.id)}
                disabled={busy === c.id}
                className="rounded bg-blue px-3 py-2 text-xs font-medium text-white transition hover:brightness-95 disabled:opacity-50"
              >
                {busy === c.id ? "처리..." : "입금확인"}
              </button>
            </div>
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
