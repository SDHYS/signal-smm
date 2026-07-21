"use client";

import { useEffect } from "react";
import Link from "next/link";

// 라우트 세그먼트 에러 바운더리 — 서버/클라이언트 렌더 중 throw를 잡아
// 깨진 기본 화면 대신 안내를 보여준다.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("route error", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[520px] flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ED1C24]/10 text-2xl">
        ⚠️
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-navy">일시적인 오류가 발생했습니다</h1>
        <p className="text-sm leading-6 text-gray">
          잠시 후 다시 시도해주세요. 문제가 계속되면 고객센터로 문의해주세요.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={reset}
          className="rounded-lg bg-navy px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="rounded-lg border border-line px-6 py-3 text-sm font-medium text-navy transition hover:bg-soft"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
