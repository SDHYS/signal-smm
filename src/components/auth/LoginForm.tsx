"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions/auth";

export default function LoginForm() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [keepLogin, setKeepLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await loginAction({ username: userId, password, keepLogin });
    setLoading(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(res.error ?? "로그인에 실패했습니다.");
    }
  }

  return (
    <div className="-mx-4 flex min-h-[calc(100vh-120px)] items-center justify-center bg-soft-2 px-4 py-10 sm:-mx-8 sm:px-8">
      <div className="flex w-full max-w-[1380px] overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
        {/* 좌측 이미지 */}
        <div className="hidden w-1/2 bg-gradient-to-br from-[#1F2353] via-[#3A4080] to-[#6B80FF] lg:block" />

        {/* 우측 폼 */}
        <div className="flex w-full flex-col gap-10 p-8 sm:p-15 lg:w-1/2">
          <div className="flex flex-col gap-2">
            <h1 className="text-[32px] font-semibold leading-[42px] text-black">
              로그인을 해주세요
            </h1>
            <p className="text-base font-normal leading-6 text-gray">
              인스타그램 좋아요 늘리기로 비즈니스를 성장하세요!
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mx-auto flex w-full max-w-[530px] flex-col items-center gap-5"
          >
            <div className="flex w-full flex-col gap-8">
              <div className="flex w-full flex-col gap-4">
                <Field label="아이디">
                  <input
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="아이디를 입력하세요"
                    className="w-full rounded border border-line px-4 py-5 text-sm text-navy placeholder:text-gray focus:border-blue focus:outline-none"
                  />
                </Field>
                <Field label="비밀번호">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="w-full rounded border border-line px-4 py-5 text-sm text-navy placeholder:text-gray focus:border-blue focus:outline-none"
                  />
                </Field>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray">
                  <input
                    type="checkbox"
                    checked={keepLogin}
                    onChange={(e) => setKeepLogin(e.target.checked)}
                    className="h-[18px] w-[18px] accent-navy"
                  />
                  로그인 상태 유지
                </label>
                <div className="flex items-center gap-2 text-sm text-navy">
                  <Link href="/find-id" className="hover:underline">
                    아이디찾기
                  </Link>
                  <span className="h-3 w-px bg-line" />
                  <Link href="/find-id" className="hover:underline">
                    비밀번호 찾기
                  </Link>
                </div>
              </div>
            </div>

            {error && (
              <p className="w-full text-sm font-medium text-[#ED1C24]">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex h-[54px] w-full items-center justify-center rounded bg-black text-base font-medium text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>

            <div className="flex items-center gap-3 text-sm">
              <span className="font-normal text-gray">아직 회원이 아니신가요?</span>
              <Link
                href="/signup"
                className="font-medium text-navy underline"
              >
                회원가입
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <span className="text-sm font-medium text-[#222222]">{label}</span>
      {children}
    </div>
  );
}
