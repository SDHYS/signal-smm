"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setOrderStatus, refundOrder, setOrderMemo, redispatchOrder, syncOrdersAction } from "@/app/actions/order";
import { safeHref } from "@/lib/safe-url";

export type AdminOrder = {
  id: string;
  orderNo: string;
  status: "PAID" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "PENDING_PAYMENT";
  total: number;
  userName: string;
  username: string;
  productName: string;
  quantity: number;
  targetUrl: string | null;
  providerOrderId: string | null;
  providerStatus: string | null;
  providerRemains: number | null;
  providerError: string | null;
  providerLinked: boolean;
  adminMemo: string;
  createdAt: string;
};

const STATUS: Record<AdminOrder["status"], { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: "입금대기", cls: "bg-soft text-gray" },
  PAID: { label: "결제완료", cls: "bg-orange/10 text-orange" },
  PROCESSING: { label: "진행중", cls: "bg-blue/10 text-blue" },
  COMPLETED: { label: "완료", cls: "bg-[#04B014]/10 text-[#04B014]" },
  CANCELLED: { label: "환불", cls: "bg-soft text-gray" },
};

// 필터 탭 정의 (전체 + 상태별)
const TABS: { key: string; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "PENDING_PAYMENT", label: "입금대기" },
  { key: "PAID", label: "결제완료" },
  { key: "PROCESSING", label: "진행중" },
  { key: "COMPLETED", label: "완료" },
  { key: "CANCELLED", label: "환불" },
];

const won = (n: number) => `${n.toLocaleString()}원`;

function Row({ o }: { o: AdminOrder }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [memo, setMemo] = useState(o.adminMemo);
  const [memoSaved, setMemoSaved] = useState(false);

  async function act(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    if (!res.ok) alert(res.error ?? "처리에 실패했습니다.");
    router.refresh();
  }

  async function refund() {
    if (!confirm(`주문 #${o.orderNo}을(를) 환불할까요? 잔액이 복구됩니다.`)) return;
    await act(() => refundOrder(o.id));
  }

  async function saveMemo() {
    setBusy(true);
    const res = await setOrderMemo(o.id, memo);
    setBusy(false);
    if (res.ok) {
      setMemoSaved(true);
      setTimeout(() => setMemoSaved(false), 1500);
    } else alert(res.error);
  }

  return (
    <div className="flex flex-col gap-3 border-b border-line p-5 last:border-0">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS[o.status].cls}`}>
              {STATUS[o.status].label}
            </span>
            <span className="text-base font-medium text-navy">{o.productName}</span>
            <span className="text-sm text-gray">x{o.quantity.toLocaleString()}</span>
          </div>
          <span className="text-sm text-gray">
            {o.userName} (@{o.username}) · #{o.orderNo} ·{" "}
            <span className="font-medium text-navy">{won(o.total)}</span> ·{" "}
            {new Date(o.createdAt).toLocaleString("ko-KR")}
          </span>
          {safeHref(o.targetUrl) && (
            <a
              href={safeHref(o.targetUrl)!}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-xs text-blue underline"
            >
              링크: {o.targetUrl}
            </a>
          )}
          {/* 도매 발주 상태 */}
          {o.providerOrderId ? (
            <span className="text-xs text-gray">
              도매 발주 <span className="font-medium text-navy">#{o.providerOrderId}</span>
              {o.providerStatus && <> · {o.providerStatus}</>}
              {o.providerRemains !== null && o.providerRemains > 0 && (
                <> · 잔여 {o.providerRemains.toLocaleString()}개</>
              )}
            </span>
          ) : o.providerError ? (
            <span className="text-xs font-medium text-[#ED1C24]">
              발주 실패: {o.providerError.slice(0, 80)}
            </span>
          ) : o.providerLinked && o.status !== "CANCELLED" ? (
            <span className="text-xs font-medium text-orange">미발주 (연동 상품)</span>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {o.status === "PAID" && (
            <button
              onClick={() => act(() => setOrderStatus(o.id, "PROCESSING"))}
              disabled={busy}
              className="rounded bg-blue px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              진행중으로
            </button>
          )}
          {/* 도매 발주된 주문은 동기화가 완료를 결정 — 수동 완료 버튼 미노출 */}
          {o.status === "PROCESSING" && !o.providerOrderId && (
            <button
              onClick={() => act(() => setOrderStatus(o.id, "COMPLETED"))}
              disabled={busy}
              className="rounded bg-[#04B014] px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              완료로
            </button>
          )}
          {o.providerLinked &&
            !o.providerOrderId &&
            o.status !== "CANCELLED" &&
            o.status !== "COMPLETED" && (
              <button
                onClick={() => act(() => redispatchOrder(o.id))}
                disabled={busy}
                className="rounded bg-orange px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
              >
                {o.providerError ? "재발주" : "발주"}
              </button>
            )}
          <Link
            href={`/orders/receipt/${o.id}`}
            className="rounded border border-line px-3 py-2 text-xs font-medium text-navy transition hover:bg-soft"
          >
            영수증
          </Link>
          {o.status !== "CANCELLED" && o.status !== "COMPLETED" && (
            <button
              onClick={refund}
              disabled={busy}
              className="rounded border border-line px-3 py-2 text-xs font-medium text-gray disabled:opacity-50"
            >
              환불
            </button>
          )}
        </div>
      </div>
      {/* 관리자 메모 */}
      <div className="flex items-center gap-2">
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="관리자 메모 (고객에게 노출되지 않음)"
          className="flex-1 rounded border border-line px-3 py-2 text-xs text-navy focus:border-blue focus:outline-none"
        />
        <button
          onClick={saveMemo}
          disabled={busy || memo === o.adminMemo}
          className="shrink-0 rounded bg-navy px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
        >
          {memoSaved ? "저장됨" : "메모 저장"}
        </button>
      </div>
    </div>
  );
}

export default function AdminOrders({
  orders,
  activeStatus,
  query,
  allCount,
  countByStatus,
  filteredCount,
  page,
  totalPages,
}: {
  orders: AdminOrder[];
  activeStatus: string;
  query: string;
  allCount: number;
  countByStatus: Record<string, number>;
  filteredCount: number;
  page: number;
  totalPages: number;
}) {
  // 탭/페이지 링크는 검색어 유지
  const linkFor = (params: Record<string, string | number>) => {
    const sp = new URLSearchParams();
    if (query) sp.set("q", query);
    for (const [k, v] of Object.entries(params)) sp.set(k, String(v));
    const s = sp.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };

  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  async function syncNow() {
    setSyncing(true);
    setSyncMsg(null);
    const res = await syncOrdersAction();
    setSyncing(false);
    setSyncMsg(res.ok ? (res.summary ?? "동기화 완료") : (res.error ?? "동기화 실패"));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-navy">주문 관리</h1>
          <p className="text-base text-gray">
            {query ? `"${query}" 검색 · ` : ""}
            {activeStatus === "ALL" ? "전체" : STATUS[activeStatus as AdminOrder["status"]]?.label} {filteredCount}건
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <a
              href={`/api/admin/orders-csv${(() => {
                const sp = new URLSearchParams();
                if (activeStatus !== "ALL") sp.set("status", activeStatus);
                if (query) sp.set("q", query);
                const s = sp.toString();
                return s ? `?${s}` : "";
              })()}`}
              className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-navy transition hover:bg-soft"
            >
              CSV 다운로드
            </a>
          <button
            onClick={syncNow}
            disabled={syncing}
            className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-navy transition hover:bg-soft disabled:opacity-50"
          >
            {syncing ? "동기화 중..." : "도매 상태 동기화"}
          </button>
          </div>
          {syncMsg && <span className="text-xs text-gray">{syncMsg}</span>}
        </div>
      </div>

      {/* 검색 */}
      <form method="GET" className="flex items-center gap-2">
        {activeStatus !== "ALL" && <input type="hidden" name="status" value={activeStatus} />}
        <input
          name="q"
          defaultValue={query}
          placeholder="주문번호 / 아이디 / 이름 / 상품명 검색"
          className="w-80 max-w-full rounded-lg border border-line px-4 py-3 text-sm text-navy focus:border-blue focus:outline-none"
        />
        <button className="rounded-lg bg-navy px-5 py-3 text-sm font-medium text-white">검색</button>
        {query && (
          <Link
            href={activeStatus === "ALL" ? "/admin/orders" : `/admin/orders?status=${activeStatus}`}
            className="text-sm text-gray underline"
          >
            초기화
          </Link>
        )}
      </form>

      {/* 상태 필터 탭 */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = t.key === activeStatus;
          const count = t.key === "ALL" ? allCount : (countByStatus[t.key] ?? 0);
          return (
            <Link
              key={t.key}
              href={linkFor(t.key === "ALL" ? {} : { status: t.key })}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active ? "bg-navy text-white" : "bg-white text-gray-2 hover:bg-soft"
              }`}
            >
              {t.label}
              <span className={`ml-1.5 ${active ? "text-white/70" : "text-gray"}`}>{count}</span>
            </Link>
          );
        })}
      </div>

      {/* 목록 */}
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {orders.length === 0 ? (
          <p className="p-8 text-base text-gray">조건에 맞는 주문이 없습니다.</p>
        ) : (
          orders.map((o) => <Row key={o.id} o={o} />)
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={linkFor(activeStatus === "ALL" ? { page: page - 1 } : { status: activeStatus, page: page - 1 })}
              className="rounded border border-line px-3 py-2 text-sm text-navy hover:bg-soft"
            >
              이전
            </Link>
          )}
          <span className="px-3 py-2 text-sm text-gray">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={linkFor(activeStatus === "ALL" ? { page: page + 1 } : { status: activeStatus, page: page + 1 })}
              className="rounded border border-line px-3 py-2 text-sm text-navy hover:bg-soft"
            >
              다음
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
