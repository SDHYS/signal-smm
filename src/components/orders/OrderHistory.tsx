"use client";

import { useState } from "react";

const topTabs = ["주문내역", "환불내역"];

const orderFilters = [
  { label: "전체", count: 11 },
  { label: "진행중", count: 0 },
  { label: "완료", count: 0 },
  { label: "부분완료(미완료수량 자동환불)", count: 0 },
  { label: "검토중", count: 0 },
  { label: "환불", count: 0 },
];

const refundFilters = [
  { label: "전체", count: 11 },
  { label: "환불", count: 0 },
  { label: "부분환불", count: 0 },
];

type Order = { title: string; status: string; no: string; total: string };
type Group = { date: string; orders: Order[] };

const make = (n: number, status: string): Order[] =>
  Array.from({ length: n }, () => ({
    title: "[0원 이벤트] 임시타이틀",
    status,
    no: "#16541616165",
    total: "00,000원",
  }));

const orderGroups: Group[] = [
  { date: "26.02.22", orders: make(4, "결제완료") },
  { date: "26.02.20", orders: make(5, "결제완료") },
  { date: "26.02.18", orders: make(2, "결제완료") },
];

const refundGroups: Group[] = [
  { date: "26.02.21", orders: make(4, "환불완료") },
  { date: "26.02.15", orders: make(2, "환불완료") },
];

function Meta({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="font-normal text-gray">{label}</span>
      <span className="h-3 w-px bg-line" />
      <span className={`font-medium ${accent ? "text-orange" : "text-navy"}`}>{value}</span>
    </span>
  );
}

function OrderRow({ order, accentStatus }: { order: Order; accentStatus: boolean }) {
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
        <button className="rounded border border-line px-6 py-3 text-sm font-medium text-navy transition hover:bg-soft/50">
          영수증
        </button>
        <button className="rounded bg-soft px-6 py-3 text-sm font-medium text-gray transition hover:brightness-95">
          거래명세서
        </button>
      </div>
    </div>
  );
}

export default function OrderHistory() {
  const [tab, setTab] = useState(0);
  const [filter, setFilter] = useState(0);

  const isRefund = tab === 1;
  const filters = isRefund ? refundFilters : orderFilters;
  const groups = isRefund ? refundGroups : orderGroups;

  function selectTab(i: number) {
    setTab(i);
    setFilter(0);
  }

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
                onClick={() => selectTab(i)}
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
        {/* 상태 필터 */}
        <div className="flex flex-wrap items-center gap-5">
          {filters.map((s, i) => {
            const active = i === filter;
            return (
              <button key={s.label} onClick={() => setFilter(i)} className="flex items-center gap-1.5">
                <span className={`text-sm ${active ? "font-medium text-orange" : "font-normal text-[#999999]"}`}>
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

        {/* 날짜별 목록 */}
        <div className="flex flex-col gap-15">
          {groups.map((g) => (
            <div key={g.date} className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xl font-normal leading-[30px] text-gray">주문날짜</span>
                <span className="text-xl font-medium leading-[30px] text-navy">{g.date}</span>
              </div>
              <div className="flex flex-col border-t border-navy">
                {g.orders.map((o, i) => (
                  <OrderRow key={i} order={o} accentStatus={!isRefund} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
