"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

function RoundCheck({
  checked,
  size = 28,
}: {
  checked: boolean;
  size?: number;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full border transition ${
        checked ? "border-blue bg-blue text-white" : "border-line bg-white text-muted"
      }`}
      style={{ width: size, height: size }}
    >
      <Check size={size * 0.55} strokeWidth={2.5} />
    </span>
  );
}

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4].map((n) => {
        const active = n === current;
        return (
          <span
            key={n}
            className={`flex h-[30px] w-[30px] items-center justify-center rounded-full text-sm font-medium ${
              active ? "bg-blue text-white" : "bg-soft text-[#D9D9D9]"
            }`}
          >
            {n}
          </span>
        );
      })}
    </div>
  );
}

export default function SignupTerms() {
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const all = terms && privacy;
  const canNext = terms && privacy;

  function toggleAll() {
    const next = !all;
    setTerms(next);
    setPrivacy(next);
  }

  return (
    <div className="-mx-4 flex min-h-[calc(100vh-120px)] items-center justify-center bg-soft-2 px-4 py-10 sm:-mx-8 sm:px-8">
      <div className="flex w-full max-w-[1380px] overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
        {/* 좌측 이미지 */}
        <div className="hidden w-1/2 bg-gradient-to-br from-[#1F2353] via-[#3A4080] to-[#6B80FF] lg:block" />

        {/* 우측 폼 */}
        <div className="flex w-full flex-col gap-10 p-8 sm:p-15 lg:w-1/2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-[32px] font-semibold leading-[42px] text-black">
                서비스 이용약관에
                <br />
                동의해주세요
              </h1>
              <p className="text-base font-normal leading-6 text-gray">
                원활한 서비스 이용을 위해 약관 동의가 필요합니다.
              </p>
            </div>
            <StepDots current={1} />
          </div>

          <div className="mx-auto flex w-full max-w-[530px] flex-col items-center gap-5">
            <div className="flex w-full flex-col gap-8">
              <div className="flex w-full flex-col gap-3">
                {/* 전체동의 */}
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-3 rounded-lg border border-line px-4 py-5 text-left transition hover:bg-soft/40"
                >
                  <RoundCheck checked={all} />
                  <span className="text-base font-medium text-black">전체동의</span>
                </button>

                {/* 필수 약관 */}
                <button
                  onClick={() => setTerms((v) => !v)}
                  className="flex items-center gap-3 rounded-lg border border-line px-4 py-5 text-left transition hover:bg-soft/40"
                >
                  <RoundCheck checked={terms} />
                  <span className="text-sm font-medium text-black">
                    <span className="text-blue">[필수]</span> 이용약관에 동의
                  </span>
                </button>

                <button
                  onClick={() => setPrivacy((v) => !v)}
                  className="flex items-center gap-3 rounded-lg border border-line px-4 py-5 text-left transition hover:bg-soft/40"
                >
                  <RoundCheck checked={privacy} />
                  <span className="text-sm font-medium text-black">
                    <span className="text-blue">[필수]</span> 개인정보처리방침 동의
                  </span>
                </button>
              </div>

              <button
                disabled={!canNext}
                className={`flex h-[54px] w-full items-center justify-center rounded text-base font-medium text-white transition ${
                  canNext ? "bg-black hover:opacity-90" : "cursor-not-allowed bg-muted"
                }`}
              >
                다음
              </button>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <span className="font-normal text-gray">이미 계정이 있으신가요?</span>
              <Link href="/login" className="font-medium text-navy underline">
                로그인
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
