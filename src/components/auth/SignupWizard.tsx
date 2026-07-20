"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { signupAction } from "@/app/actions/auth";

function RoundCheck({ checked, size = 28 }: { checked: boolean; size?: number }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full border transition ${
        checked ? "border-blue bg-blue text-white" : "border-line bg-white text-transparent"
      }`}
      style={{ width: size, height: size }}
    >
      {/* 체크 시에만 아이콘 노출 — 미체크는 빈 원(색상만이 아니라 형태로 구분) */}
      {checked && <Check size={size * 0.55} strokeWidth={2.5} />}
    </span>
  );
}

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className={`flex h-[30px] w-[30px] items-center justify-center rounded-full text-sm font-medium ${
            n === current ? "bg-blue text-white" : "bg-soft text-[#D9D9D9]"
          }`}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  hint,
  autoComplete,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  autoComplete?: string;
}) {
  const id = useId();
  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-[#222222]">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded border border-line px-4 py-5 text-sm text-navy placeholder:text-gray focus:border-blue focus:outline-none"
      />
      {hint && <p className="text-sm font-normal text-gray">{hint}</p>}
    </div>
  );
}

function Shell({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-4 flex min-h-[calc(100vh-120px)] items-center justify-center bg-soft-2 px-4 py-10 sm:-mx-8 sm:px-8">
      <div className="flex w-full max-w-[1380px] overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.06)]">
        <div
          className="hidden w-1/2 bg-cover bg-center lg:block"
          style={{ backgroundImage: "url(/brand/auth-hero.jpg)" }}
          aria-hidden
        />
        <div className="flex w-full flex-col gap-10 p-8 sm:p-15 lg:w-1/2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="whitespace-pre-line text-[22px] font-semibold leading-8 sm:text-[28px] sm:leading-10 lg:text-[32px] lg:leading-[42px] text-black">
                {title}
              </h1>
              <p className="text-base font-normal leading-6 text-gray">{subtitle}</p>
            </div>
            <StepDots current={step} />
          </div>

          <div className="mx-auto flex w-full max-w-[530px] flex-col items-center gap-5">
            {children}
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

function NavButtons({
  onPrev,
  onNext,
  nextEnabled = true,
  nextLabel = "다음",
}: {
  onPrev?: () => void;
  onNext?: () => void;
  nextEnabled?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {onPrev && (
        <button
          onClick={onPrev}
          className="flex h-[54px] flex-1 items-center justify-center rounded bg-soft text-base font-medium text-gray transition hover:brightness-95"
        >
          이전
        </button>
      )}
      <button
        onClick={onNext}
        disabled={!nextEnabled}
        className={`flex h-[54px] flex-1 items-center justify-center rounded text-base font-medium text-white transition ${
          nextEnabled ? "bg-black hover:opacity-90" : "cursor-not-allowed bg-muted"
        }`}
      >
        {nextLabel}
      </button>
    </div>
  );
}

export default function SignupWizard({
  copy,
  channels,
}: {
  copy: Record<string, string>;
  channels: string[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // step 1
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const all = terms && privacy;

  // step 2
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  // step 3
  const [channel, setChannel] = useState<string | null>(null);

  function toggleAll() {
    const next = !all;
    setTerms(next);
    setPrivacy(next);
  }

  const step2Valid =
    userId.trim() !== "" &&
    email.trim() !== "" &&
    password.length >= 8 &&
    password === passwordConfirm;

  async function handleSignup() {
    setError(null);
    setLoading(true);
    const res = await signupAction({
      username: userId,
      email,
      password,
      passwordConfirm,
      signupChannel: channel,
    });
    setLoading(false);
    if (res.ok) {
      setStep(4);
      router.refresh();
    } else {
      setError(res.error ?? "회원가입에 실패했습니다.");
    }
  }

  if (step === 1)
    return (
      <Shell step={1} title={copy.signup1_title} subtitle={copy.signup1_subtitle}>
        <div className="flex w-full flex-col gap-8">
          <div className="flex w-full flex-col gap-3">
            <button
              type="button"
              role="checkbox"
              aria-checked={all}
              onClick={toggleAll}
              className="flex items-center gap-3 rounded-lg border border-line px-4 py-5 text-left transition hover:bg-soft/40"
            >
              <RoundCheck checked={all} />
              <span className="text-base font-medium text-black">전체동의</span>
            </button>
            <button
              type="button"
              role="checkbox"
              aria-checked={terms}
              onClick={() => setTerms((v) => !v)}
              className="flex items-center gap-3 rounded-lg border border-line px-4 py-5 text-left transition hover:bg-soft/40"
            >
              <RoundCheck checked={terms} />
              <span className="flex-1 text-sm font-medium text-black">
                <span className="text-blue">[필수]</span> 이용약관에 동의
              </span>
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 text-xs text-gray underline hover:text-navy"
              >
                보기
              </a>
            </button>
            <button
              type="button"
              role="checkbox"
              aria-checked={privacy}
              onClick={() => setPrivacy((v) => !v)}
              className="flex items-center gap-3 rounded-lg border border-line px-4 py-5 text-left transition hover:bg-soft/40"
            >
              <RoundCheck checked={privacy} />
              <span className="flex-1 text-sm font-medium text-black">
                <span className="text-blue">[필수]</span> 개인정보처리방침 동의
              </span>
              <a
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 text-xs text-gray underline hover:text-navy"
              >
                보기
              </a>
            </button>
          </div>
          <NavButtons nextEnabled={all} onNext={() => setStep(2)} />
        </div>
      </Shell>
    );

  if (step === 2)
    return (
      <Shell step={2} title={copy.signup2_title} subtitle={copy.signup2_subtitle}>
        <div className="flex w-full flex-col gap-8">
          <div className="flex w-full flex-col gap-5">
            <Field label="아이디" placeholder="가입 진행 아이디" value={userId} onChange={setUserId} autoComplete="username" />
            <Field label="이메일" type="email" placeholder="계정 분실 시 확인용 이메일" value={email} onChange={setEmail} autoComplete="email" />
            <Field
              label="비밀번호"
              type="password"
              placeholder="8자 이상 입력"
              value={password}
              onChange={setPassword}
              hint="8자 이상 입력해주세요"
              autoComplete="new-password"
            />
            <Field
              label="비밀번호 확인"
              type="password"
              placeholder="비밀번호 재확인"
              value={passwordConfirm}
              onChange={setPasswordConfirm}
              autoComplete="new-password"
            />
            {passwordConfirm.length > 0 && password !== passwordConfirm && (
              <p className="-mt-3 text-sm font-medium text-[#ED1C24]">
                비밀번호가 일치하지 않습니다.
              </p>
            )}
          </div>
          <NavButtons
            onPrev={() => setStep(1)}
            onNext={() => setStep(3)}
            nextEnabled={step2Valid}
          />
        </div>
      </Shell>
    );

  // step 4 — 가입 완료
  if (step === 4)
    return (
      <Shell step={4} title={copy.signup4_title} subtitle={copy.signup4_subtitle}>
        <div className="flex w-full flex-col items-center gap-8 py-6">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-blue text-white">
            <Check size={44} strokeWidth={2.5} />
          </span>
          <p className="text-center text-base text-gray">
            {copy.signup4_welcome}
          </p>
          <button
            onClick={() => {
              router.push("/");
              router.refresh();
            }}
            className="flex h-[54px] w-full items-center justify-center rounded bg-black text-base font-medium text-white transition hover:opacity-90"
          >
            {copy.signup4_button}
          </button>
        </div>
      </Shell>
    );

  // step 3 — 추가 정보(가입 경로)
  return (
    <Shell step={3} title={copy.signup3_title} subtitle={copy.signup3_subtitle}>
      <div className="flex w-full flex-col gap-8">
        <div className="flex w-full flex-col gap-2">
          <span className="text-sm font-medium text-[#222222]">가입 경로</span>
          <div className="flex flex-wrap items-center gap-3">
            {channels.map((c) => {
              const active = c === channel;
              return (
                <button
                  key={c}
                  onClick={() => setChannel(c)}
                  className={`rounded px-7 py-4 text-sm font-normal transition ${
                    active
                      ? "bg-blue text-white outline outline-1 outline-blue"
                      : "text-gray outline outline-1 outline-line hover:outline-gray-2"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
        {error && (
          <p role="alert" className="w-full text-sm font-medium text-[#ED1C24]">{error}</p>
        )}
        <NavButtons
          onPrev={() => setStep(2)}
          onNext={handleSignup}
          nextEnabled={channel !== null && !loading}
          nextLabel={loading ? "가입 중..." : "가입하기"}
        />
      </div>
    </Shell>
  );
}
