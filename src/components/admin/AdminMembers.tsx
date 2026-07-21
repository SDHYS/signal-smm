"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adjustBalance, resetPassword } from "@/app/actions/members";

export type MemberRow = {
  id: string;
  username: string;
  name: string;
  email: string;
  balance: number;
  orderCount: number;
  role: "USER" | "ADMIN";
  createdAt: string;
};

const won = (n: number) => `${n.toLocaleString()}원`;

function Row({ m }: { m: MemberRow }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [tempPw, setTempPw] = useState<string | null>(null);

  async function adjust(sign: 1 | -1) {
    const v = Number(amount);
    if (!v) return alert("조정 금액을 입력해주세요.");
    setBusy(true);
    const res = await adjustBalance(m.id, sign * v);
    setBusy(false);
    if (!res.ok) alert(res.error);
    else setAmount("");
    router.refresh();
  }

  async function reset() {
    if (!confirm(`${m.username} 회원의 비밀번호를 초기화할까요?`)) return;
    setBusy(true);
    const res = await resetPassword(m.id);
    setBusy(false);
    if (res.ok) setTempPw(res.data ?? null);
    else alert(res.error);
  }

  return (
    <div className="flex flex-col gap-3 border-b border-line px-6 py-4 last:border-0 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col">
        <span className="flex items-center gap-2 font-medium text-navy">
          <Link href={`/admin/members/${m.id}`} className="hover:underline">
            {m.name}
          </Link>
          <span className="text-sm text-gray">@{m.username}</span>
          {m.role === "ADMIN" && (
            <span className="rounded-full bg-navy px-2 py-0.5 text-xs text-white">관리자</span>
          )}
        </span>
        <span className="text-sm text-gray">
          {m.email} · 잔액 <span className="font-medium text-navy">{won(m.balance)}</span> · 주문{" "}
          {m.orderCount}건 · 가입 {m.createdAt.slice(0, 10).replace(/-/g, ".")}
        </span>
        {tempPw && (
          <span className="mt-1 text-sm font-medium text-orange">
            임시 비밀번호: {tempPw} (지금만 표시됩니다 — 회원에게 전달하세요)
          </span>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder="금액"
          aria-label="금액"
          className="w-28 rounded border border-line px-3 py-2 text-sm text-navy focus:border-blue focus:outline-none"
        />
        <button
          onClick={() => adjust(1)}
          disabled={busy}
          className="rounded bg-blue px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
        >
          증액
        </button>
        <button
          onClick={() => adjust(-1)}
          disabled={busy}
          className="rounded border border-line px-3 py-2 text-xs font-medium text-gray disabled:opacity-50"
        >
          차감
        </button>
        <button
          onClick={reset}
          disabled={busy}
          className="rounded border border-line px-3 py-2 text-xs font-medium text-gray hover:bg-soft disabled:opacity-50"
        >
          비번 초기화
        </button>
        <Link
          href={`/admin/members/${m.id}`}
          className="rounded border border-line px-3 py-2 text-xs font-medium text-navy hover:bg-soft"
        >
          상세
        </Link>
      </div>
    </div>
  );
}

export default function AdminMembers({
  members,
  total,
  q,
}: {
  members: MemberRow[];
  total: number;
  q?: string;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-navy">회원 관리</h1>
        <p className="text-base text-gray">전체 {total}명</p>
      </div>

      {/* 검색 (GET) */}
      <form method="GET" className="flex items-center gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="아이디 / 이름 / 이메일 검색"
          aria-label="아이디 / 이름 / 이메일 검색"
          className="w-72 rounded-lg border border-line px-4 py-3 text-sm text-navy focus:border-blue focus:outline-none"
        />
        <button className="rounded-lg bg-navy px-5 py-3 text-sm font-medium text-white">
          검색
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {members.length === 0 ? (
          <p className="p-8 text-base text-gray">회원이 없습니다.</p>
        ) : (
          members.map((m) => <Row key={m.id} m={m} />)
        )}
      </div>
    </div>
  );
}
