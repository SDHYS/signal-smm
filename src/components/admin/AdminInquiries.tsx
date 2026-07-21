"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { answerInquiry } from "@/app/actions/inquiry";

export type UserContext = {
  balance: number;
  orderCount: number;
  spent: number;
  chargedTotal: number;
  pendingCharges: number;
};

export type AdminInquiry = {
  id: string;
  title: string;
  content: string;
  userName: string;
  username: string;
  status: "PENDING" | "ANSWERED";
  answer: string | null;
  date: string;
  ctx: UserContext;
};

const won = (n: number) => `${n.toLocaleString()}원`;

function Item({ q }: { q: AdminInquiry }) {
  const router = useRouter();
  const [answer, setAnswer] = useState(q.answer ?? "");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    await answerInquiry(q.id, answer);
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 border-b border-line p-6 last:border-0">
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            q.status === "ANSWERED" ? "bg-blue/10 text-blue" : "bg-orange/10 text-orange"
          }`}
        >
          {q.status === "ANSWERED" ? "답변완료" : "답변대기"}
        </span>
        <span className="text-base font-medium text-navy">{q.title}</span>
        <span className="text-sm text-gray">
          {q.userName} (@{q.username}) · {q.date}
        </span>
      </div>
      {/* 문의자 컨텍스트 — 답변 판단에 필요한 회원 상황 */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-lg border border-line bg-white px-4 py-2.5 text-xs">
        <Ctx label="보유잔액" value={won(q.ctx.balance)} accent />
        <Ctx label="누적주문" value={`${q.ctx.orderCount}건`} />
        <Ctx label="누적결제" value={won(q.ctx.spent)} />
        <Ctx label="누적충전" value={won(q.ctx.chargedTotal)} />
        {q.ctx.pendingCharges > 0 && (
          <Ctx label="입금대기" value={`${q.ctx.pendingCharges}건`} warn />
        )}
      </div>
      <p className="whitespace-pre-line rounded-lg bg-soft p-4 text-sm text-gray">{q.content}</p>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="답변 입력"
        aria-label="답변 입력"
        rows={3}
        className="w-full resize-y rounded border border-line px-4 py-3 text-sm text-navy focus:border-blue focus:outline-none"
      />
      <button
        onClick={submit}
        disabled={saving}
        className="self-start rounded bg-navy px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving ? "등록 중..." : q.status === "ANSWERED" ? "답변 수정" : "답변 등록"}
      </button>
    </div>
  );
}

function Ctx({ label, value, accent, warn }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-gray">{label}</span>
      <span className={`font-semibold ${warn ? "text-orange" : accent ? "text-blue" : "text-navy"}`}>
        {value}
      </span>
    </span>
  );
}

export default function AdminInquiries({ inquiries }: { inquiries: AdminInquiry[] }) {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold text-navy">1:1 문의 관리</h1>
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {inquiries.length === 0 ? (
          <p className="p-8 text-base text-gray">문의가 없습니다.</p>
        ) : (
          inquiries.map((q) => <Item key={q.id} q={q} />)
        )}
      </div>
    </div>
  );
}
