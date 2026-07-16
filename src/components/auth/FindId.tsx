"use client";

import { useState } from "react";
import Link from "next/link";
import { findUsername } from "@/app/actions/user";

export default function FindId({ eyebrow }: { eyebrow: string }) {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    const res = await findUsername(email);
    setLoading(false);
    if (res.ok) setResult(res.data ?? "");
    else setError(res.error ?? "조회에 실패했습니다.");
  }

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-8 pt-10">
      <div className="flex flex-col gap-2.5">
        <p className="text-base font-normal text-[#767676]">{eyebrow}</p>
        <h1 className="text-[26px] font-bold leading-9 sm:text-[34px] sm:leading-[46px] lg:text-[40px] lg:leading-[52px] text-black">아이디·비밀번호 찾기</h1>
      </div>

      {/* 아이디 찾기 */}
      <form
        onSubmit={submit}
        className="flex flex-col gap-4 rounded-2xl border border-line p-8"
      >
        <label className="text-sm font-medium text-[#222222]">
          가입 시 등록한 이메일
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일 입력"
          className="w-full rounded border border-line px-4 py-4 text-sm text-navy placeholder:text-gray focus:border-blue focus:outline-none"
        />
        {error && <p role="alert" className="text-sm font-medium text-[#ED1C24]">{error}</p>}
        {result && (
          <div role="status" aria-live="polite" className="rounded-lg bg-blue/5 p-5 text-center">
            <p className="text-sm text-gray">회원님의 아이디</p>
            <p className="mt-1 text-2xl font-bold tracking-wider text-navy">{result}</p>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex h-[54px] w-full items-center justify-center rounded bg-black text-base font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "조회 중..." : "아이디 찾기"}
        </button>
      </form>

      {/* 비밀번호 안내 */}
      <div id="password" className="flex scroll-mt-20 flex-col gap-3 rounded-2xl bg-soft p-8">
        <p className="text-lg font-semibold text-navy">비밀번호를 잊으셨나요?</p>
        <p className="text-sm leading-6 text-gray">
          보안을 위해 비밀번호는 관리자 확인 후 초기화해드립니다.
          <br />
          1:1 문의 또는 고객센터로 아이디와 함께 요청해주세요. 초기화되면 알림으로
          안내드립니다.
        </p>
        <div className="flex items-center gap-2">
          <Link
            href="/support"
            className="rounded-lg bg-navy px-5 py-3 text-sm font-medium text-white"
          >
            고객센터
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-white px-5 py-3 text-sm font-medium text-gray"
          >
            로그인으로
          </Link>
        </div>
      </div>
    </div>
  );
}
