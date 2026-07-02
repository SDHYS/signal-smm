"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const topTabs = ["주문내역", "환불내역"];

export type OrderItem = {
  id: string;
  title: string;
  status: string;
  no: string;
  total: string;
};
export type OrderGroup = { date: string; orders: OrderItem[] };

function Meta({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="font-normal text-gray">{label}</span>
      <span className="h-3 w-px bg-line" />
      <span className={`font-medium ${accent ? "text-orange" : "text-navy"}`}>{value}</span>
    </span>
  );
}

function Row({ order, accentStatus }: { order: OrderItem; accentStatus: boolean }) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 border-b border-line py-7 lg:flex-row lg:items-center">
      <div className="flex flex-col gap-3">
        <p className="text-lg font-medium leading-[26px] text-navy">{order.title}</p>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-2 text-sm">
          <span className="flex items-center gap-2">
            <span className="font-normal text-gray">주문상태</span>
            <span className="h-3 w-px bg-line" />
            <span className={`font-medium ${accentStatus ? "text-orange" : "text-gray"}`}>
              {order.status}
            </span>
          </span>
          <Meta label="주문번호" value={order.no} />
          <Meta label="합계" value={order.total} />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => alert("영수증 발급 기능은 준비 중입니다.")}
          className="rounded border border-line px-6 py-3 text-sm font-medium text-navy transition hover:bg-soft/50"
        >
          영수증
        </button>
        <button
          onClick={() => alert("거래명세서 발급 기능은 준비 중입니다.")}
          className="rounded bg-soft px-6 py-3 text-sm font-medium text-gray transition hover:brightness-95"
        >
          거래명세서
        </button>
      </div>
    </div>
  );
}

export default function OrderHistory({
  isLoggedIn,
  orderGroups,
  refundGroups,
  orderTotal,
  refundTotal,
}: {
  isLoggedIn: boolean;
  orderGroups: OrderGroup[];
  refundGroups: OrderGroup[];
  orderTotal: number;
  refundTotal: number;
}) {
  const [tab, setTab] = useState(0);
  const [filter, setFilter] = useState("전체");

  const isRefund = tab === 1;
  const groups = isRefund ? refundGroups : orderGroups;
  const total = isRefund ? refundTotal : orderTotal;

  // 상태별 카운트 (현재 탭 기준)
  const statusChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of groups)
      for (const o of g.orders) counts.set(o.status, (counts.get(o.status) ?? 0) + 1);
    return [
      { label: "전체", count: total },
      ...[...counts.entries()].map(([label, count]) => ({ label, count })),
    ];
  }, [groups, total]);

  // 필터 적용 (빈 날짜 그룹 제거)
  const shownGroups = useMemo(() => {
    if (filter === "전체") return groups;
    return groups
      .map((g) => ({ ...g, orders: g.orders.filter((o) => o.status === filter) }))
      .filter((g) => g.orders.length > 0);
  }, [groups, filter]);

  return (
    <div className="flex flex-col gap-12 pt-2">
      {/* 헤더 */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2.5">
          <p className="text-base font-normal text-[#767676]">임시타이틀</p>
          <h1 className="text-[40px] font-bold leading-[52px] text-black">
            {isRefund ? "환불내역" : "주문내역"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {topTabs.map((t, i) => {
            const active = i === tab;
            return (
              <button
                key={t}
                onClick={() => {
                  setTab(i);
                  setFilter("전체");
                }}
                className={`rounded-full px-6 py-3 text-sm font-medium transition ${
                  active ? "bg-blue text-white" : "bg-white text-gray-2 hover:bg-soft"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-7">
        {/* 상태 필터 칩 */}
        <div className="flex flex-wrap items-center gap-5">
          {statusChips.map((s) => {
            const active = s.label === filter;
            return (
              <button
                key={s.label}
                onClick={() => setFilter(s.label)}
                className="flex items-center gap-1.5"
              >
                <span
                  className={`text-sm ${
                    active ? "font-medium text-orange" : "font-normal text-[#999999]"
                  }`}
                >
                  {s.label}
                </span>
                <span
                  className={`rounded-full px-3 text-sm font-medium ${
                    active ? "bg-orange text-white" : "bg-[#F4F4F4] text-[#999999]"
                  }`}
                >
                  {s.count}
                </span>
              </button>
            );
          })}
        </div>

        {!isLoggedIn ? (
          <div className="flex items-center justify-between gap-4 rounded-xl bg-soft px-6 py-5">
            <span className="text-base font-medium text-navy">
              로그인 후 주문내역을 확인할 수 있습니다.
            </span>
            <Link href="/login" className="rounded-lg bg-blue px-6 py-3 text-sm font-medium text-white">
              로그인
            </Link>
          </div>
        ) : shownGroups.length === 0 ? (
          <p className="rounded-xl bg-soft p-8 text-base text-gray">
            {isRefund ? "환불 내역이 없습니다." : "주문 내역이 없습니다."}
          </p>
        ) : (
          <div className="flex flex-col gap-15">
            {shownGroups.map((g) => (
              <div key={g.date} className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-normal leading-[30px] text-gray">주문날짜</span>
                  <span className="text-xl font-medium leading-[30px] text-navy">{g.date}</span>
                </div>
                <div className="flex flex-col border-t border-navy">
                  {g.orders.map((o) => (
                    <Row key={o.id} order={o} accentStatus={!isRefund} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
