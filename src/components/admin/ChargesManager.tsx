"use client";

import { useState } from "react";
import { fmtKST, fmtKSTDate } from "@/lib/datetime";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  confirmCharge,
  cancelCharge,
  confirmChargesBulk,
} from "@/app/actions/charge";

type ChargeStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type AdminCharge = {
  id: string;
  amount: number;
  total: number;
  depositorName: string;
  receiptType: string;
  status: ChargeStatus;
  username: string;
  name: string;
  createdAt: string;
  confirmedAt: string | null;
};

const won = (n: number) => `${n.toLocaleString()}원`;

const TABS: { key: string; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "PENDING", label: "입금대기" },
  { key: "CONFIRMED", label: "충전완료" },
  { key: "CANCELLED", label: "취소" },
];

const statusMeta: Record<ChargeStatus, { label: string; cls: string }> = {
  PENDING: { label: "입금대기", cls: "bg-orange/10 text-orange" },
  CONFIRMED: { label: "충전완료", cls: "bg-blue/10 text-blue" },
  CANCELLED: { label: "취소", cls: "bg-soft text-gray" },
};

export default function ChargesManager({
  charges,
  activeStatus,
  query,
  allCount,
  countByStatus,
  filteredCount,
  page,
  totalPages,
}: {
  charges: AdminCharge[];
  activeStatus: string;
  query: string;
  allCount: number;
  countByStatus: Record<string, number>;
  filteredCount: number;
  page: number;
  totalPages: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const pendingIds = charges.filter((c) => c.status === "PENDING").map((c) => c.id);
  const allPendingSelected = pendingIds.length > 0 && pendingIds.every((id) => selected.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected(allPendingSelected ? new Set() : new Set(pendingIds));
  }

  function tabHref(key: string) {
    const p = new URLSearchParams();
    if (key !== "ALL") p.set("status", key);
    if (query) p.set("q", query);
    const qs = p.toString();
    return qs ? `/admin/charges?${qs}` : "/admin/charges";
  }
  function pageHref(n: number) {
    const p = new URLSearchParams();
    if (activeStatus !== "ALL") p.set("status", activeStatus);
    if (query) p.set("q", query);
    p.set("page", String(n));
    return `/admin/charges?${p.toString()}`;
  }

  async function confirmOne(id: string) {
    setBusy(id);
    setError(null);
    const res = await confirmCharge(id);
    setBusy(null);
    if (res.ok) router.refresh();
    else setError(res.error ?? "처리에 실패했습니다.");
  }

  async function confirmPartial(c: AdminCharge) {
    const input = prompt(
      `부분입금 처리 — 실제 적립할 금액(원)을 입력하세요.\n신청 금액: ${won(c.amount)}`,
      String(c.amount),
    );
    if (input === null) return;
    const credit = Math.floor(Number(input.replace(/[^0-9]/g, "")));
    if (!credit || credit <= 0) return setError("적립 금액이 올바르지 않습니다.");
    setBusy(c.id);
    setError(null);
    const res = await confirmCharge(c.id, { creditAmount: credit });
    setBusy(null);
    if (res.ok) router.refresh();
    else setError(res.error ?? "처리에 실패했습니다.");
  }

  async function cancelOne(id: string) {
    if (!confirm("이 충전 신청을 취소할까요?")) return;
    setBusy(id);
    setError(null);
    const res = await cancelCharge(id);
    setBusy(null);
    if (res.ok) router.refresh();
    else setError(res.error ?? "처리에 실패했습니다.");
  }

  async function bulkConfirm() {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`선택한 ${ids.length}건을 일괄 입금확인할까요?`)) return;
    setBusy("__bulk__");
    setError(null);
    const res = await confirmChargesBulk(ids);
    setBusy(null);
    if (res.ok) {
      setSelected(new Set());
      if (res.failed > 0) setError(`${res.confirmed}건 확인, ${res.failed}건 실패`);
      router.refresh();
    } else setError(res.error ?? "처리에 실패했습니다.");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-navy">충전 관리</h1>
        <p className="text-base text-gray">
          전체 <span className="font-semibold text-navy">{allCount}</span>건 · 입금대기{" "}
          <span className="font-semibold text-orange">{countByStatus.PENDING ?? 0}</span>건
        </p>
      </div>

      {/* 상태 탭 + 검색 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const active = t.key === activeStatus;
            const count = t.key === "ALL" ? allCount : countByStatus[t.key] ?? 0;
            return (
              <Link
                key={t.key}
                href={tabHref(t.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active ? "bg-navy text-white" : "bg-white text-gray-2 hover:bg-soft"
                }`}
              >
                {t.label} {count}
              </Link>
            );
          })}
        </div>
        <form method="get" action="/admin/charges" className="flex items-center gap-2">
          {activeStatus !== "ALL" && <input type="hidden" name="status" value={activeStatus} />}
          <input
            name="q"
            defaultValue={query}
            placeholder="입금자명·아이디·이름 검색"
            aria-label="충전 신청 검색"
            className="w-56 rounded border border-line px-3 py-2 text-sm text-navy placeholder:text-gray focus:border-blue focus:outline-none"
          />
          <button className="rounded bg-navy px-4 py-2 text-sm font-medium text-white">검색</button>
        </form>
      </div>

      {error && <p role="alert" className="text-sm font-medium text-[#ED1C24]">{error}</p>}

      {/* 벌크 액션 바 */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-blue/5 px-4 py-3">
          <span className="text-sm font-medium text-navy">{selected.size}건 선택됨</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="rounded border border-line px-3 py-2 text-xs font-medium text-gray hover:bg-soft"
            >
              선택 해제
            </button>
            <button
              onClick={bulkConfirm}
              disabled={busy === "__bulk__"}
              className="rounded bg-blue px-4 py-2 text-xs font-medium text-white transition hover:brightness-95 disabled:opacity-50"
            >
              {busy === "__bulk__" ? "처리 중..." : "선택 일괄 입금확인"}
            </button>
          </div>
        </div>
      )}

      {charges.length === 0 ? (
        <p className="rounded-xl border border-line bg-white p-8 text-base text-gray">
          해당 조건의 충전 신청이 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <div className="min-w-[860px]">
            <div className="flex items-center bg-soft px-6 py-4 text-sm font-medium text-gray">
              <div className="w-[44px]">
                {pendingIds.length > 0 && (
                  <input
                    type="checkbox"
                    checked={allPendingSelected}
                    onChange={toggleAll}
                    aria-label="입금대기 전체 선택"
                    className="h-4 w-4 accent-blue"
                  />
                )}
              </div>
              <div className="w-[200px]">회원</div>
              <div className="flex-1">입금자명 · 신청일</div>
              <div className="w-[110px] text-right">충전금액</div>
              <div className="w-[120px] text-right">입금액</div>
              <div className="w-[90px] text-center">상태</div>
              <div className="w-[200px]" />
            </div>
            {charges.map((c) => {
              const isPending = c.status === "PENDING";
              return (
                <div key={c.id} className="flex items-center border-t border-line px-6 py-4 text-sm">
                  <div className="w-[44px]">
                    {isPending && (
                      <input
                        type="checkbox"
                        checked={selected.has(c.id)}
                        onChange={() => toggle(c.id)}
                        aria-label={`${c.depositorName} 선택`}
                        className="h-4 w-4 accent-blue"
                      />
                    )}
                  </div>
                  <div className="flex w-[200px] flex-col">
                    <span className="font-medium text-navy">{c.name}</span>
                    <span className="text-gray">@{c.username}</span>
                  </div>
                  <div className="flex flex-1 flex-col">
                    <span className="font-medium text-navy">{c.depositorName}</span>
                    <span className="text-gray">
                      {c.receiptType} · {fmtKST(c.createdAt)}
                    </span>
                  </div>
                  <div className="w-[110px] text-right font-medium text-navy">{won(c.amount)}</div>
                  <div className="w-[120px] text-right font-semibold text-orange">{won(c.total)}</div>
                  <div className="w-[90px] text-center">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta[c.status].cls}`}>
                      {statusMeta[c.status].label}
                    </span>
                  </div>
                  <div className="flex w-[200px] items-center justify-end gap-2">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => cancelOne(c.id)}
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
                          onClick={() => confirmOne(c.id)}
                          disabled={busy === c.id}
                          className="rounded bg-blue px-3 py-2 text-xs font-medium text-white transition hover:brightness-95 disabled:opacity-50"
                        >
                          {busy === c.id ? "처리..." : "입금확인"}
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray">
                        {c.confirmedAt ? fmtKSTDate(c.confirmedAt) : "—"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="rounded border border-line px-3 py-2 text-sm text-navy hover:bg-soft">
              이전
            </Link>
          )}
          <span className="text-sm text-gray">
            {page} / {totalPages} · 총 {filteredCount}건
          </span>
          {page < totalPages && (
            <Link href={pageHref(page + 1)} className="rounded border border-line px-3 py-2 text-sm text-navy hover:bg-soft">
              다음
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
