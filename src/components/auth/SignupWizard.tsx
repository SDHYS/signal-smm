"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

function RoundCheck({ checked, size = 28 }: { checked: boolean; size?: number }) {
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
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <span className="text-sm font-medium text-[#222222]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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
        <div className="hidden w-1/2 bg-gradient-to-br from-[#1F2353] via-[#3A4080] to-[#6B80FF] lg:block" />
        <div className="flex w-full flex-col gap-10 p-8 sm:p-15 lg:w-1/2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-[32px] font-semibold leading-[42px] text-black">
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

export default function SignupWizard() {
  const [step, setStep] = useState(1);

  // step 1
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const all = terms && privacy;

  // step 2
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

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

  if (step === 1) {
    return (
      <Shell
        step={1}
        title={
          <>
            서비스 이용약관에
            <br />
            동의해주세요
          </>
        }
        subtitle="원활한 서비스 이용을 위해 약관 동의가 필요합니다."
      >
        <div className="flex w-full flex-col gap-8">
          <div className="flex w-full flex-col gap-3">
            <button
              onClick={toggleAll}
              className="flex items-center gap-3 rounded-lg border border-line px-4 py-5 text-left transition hover:bg-soft/40"
            >
              <RoundCheck checked={all} />
              <span className="text-base font-medium text-black">전체동의</span>
            </button>
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
            disabled={!all}
            onClick={() => setStep(2)}
            className={`flex h-[54px] w-full items-center justify-center rounded text-base font-medium text-white transition ${
              all ? "bg-black hover:opacity-90" : "cursor-not-allowed bg-muted"
            }`}
          >
            다음
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell
      step={2}
      title={
        <>
          계정 정보를
          <br />
          입력해주세요
        </>
      }
      subtitle="서비스 이용에 필요한 기본 정보입니다."
    >
      <div className="flex w-full flex-col gap-8">
        <div className="flex w-full flex-col gap-5">
          <Field label="아이디" placeholder="가입 진행 아이디" value={userId} onChange={setUserId} />
          <Field label="이메일" type="email" placeholder="계정 분실 시 확인용 이메일" value={email} onChange={setEmail} />
          <Field
            label="비밀번호"
            type="password"
            placeholder="8자 이상 입력"
            value={password}
            onChange={setPassword}
            hint="8자 이상 입력해주세요"
          />
          <Field
            label="비밀번호 확인"
            type="password"
            placeholder="비밀번호 재확인"
            value={passwordConfirm}
            onChange={setPasswordConfirm}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep(1)}
            className="flex h-[54px] flex-1 items-center justify-center rounded bg-soft text-base font-medium text-gray transition hover:brightness-95"
          >
            이전
          </button>
          <button
            disabled={!step2Valid}
            className={`flex h-[54px] flex-1 items-center justify-center rounded text-base font-medium text-white transition ${
              step2Valid ? "bg-black hover:opacity-90" : "cursor-not-allowed bg-muted"
            }`}
          >
            다음
          </button>
        </div>
      </div>
    </Shell>
  );
}
