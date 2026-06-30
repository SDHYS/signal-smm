"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { answerInquiry } from "@/app/actions/inquiry";

export type AdminInquiry = {
  id: string;
  title: string;
  content: string;
  userName: string;
  username: string;
  status: "PENDING" | "ANSWERED";
  answer: string | null;
  date: string;
};

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
      <p className="whitespace-pre-line rounded-lg bg-soft p-4 text-sm text-gray">{q.content}</p>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="답변 입력"
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
