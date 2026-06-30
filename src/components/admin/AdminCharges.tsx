"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmCharge, cancelCharge } from "@/app/actions/charge";

export type PendingCharge = {
  id: string;
  amount: number;
  total: number;
  depositorName: string;
  receiptType: string;
  username: string;
  name: string;
  createdAt: string;
};

const won = (n: number) => `${n.toLocaleString()}원`;

export default function AdminCharges({ charges }: { charges: PendingCharge[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(id: string, fn: typeof confirmCharge) {
    setBusy(id);
    setError(null);
    const res = await fn(id);
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
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <div className="flex items-center bg-soft px-6 py-4 text-sm font-medium text-gray">
          <div className="w-[200px]">회원</div>
          <div className="flex-1">입금자명</div>
          <div className="w-[120px] text-right">충전금액</div>
          <div className="w-[140px] text-right">입금액</div>
          <div className="w-[120px]" />
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
                {c.receiptType} · {new Date(c.createdAt).toLocaleString("ko-KR")}
              </span>
            </div>
            <div className="w-[120px] text-right font-medium text-navy">{won(c.amount)}</div>
            <div className="w-[140px] text-right font-semibold text-orange">{won(c.total)}</div>
            <div className="flex w-[120px] items-center justify-end gap-2">
              <button
                onClick={() => run(c.id, cancelCharge)}
                disabled={busy === c.id}
                className="rounded border border-line px-3 py-2 text-xs font-medium text-gray transition hover:bg-soft disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={() => run(c.id, confirmCharge)}
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
  );
}
