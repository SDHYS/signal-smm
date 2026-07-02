"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, changePassword } from "@/app/actions/user";

export type MyInfo = {
  username: string;
  name: string;
  email: string;
  phone: string | null;
  balance: number;
  createdAt: string;
};

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-[#222222]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded border border-line px-4 py-3.5 text-sm text-navy placeholder:text-gray focus:border-blue focus:outline-none disabled:bg-soft disabled:text-gray"
      />
    </div>
  );
}

export default function MyPage({ info }: { info: MyInfo }) {
  const router = useRouter();

  // 내 정보
  const [name, setName] = useState(info.name);
  const [phone, setPhone] = useState(info.phone ?? "");
  const [email, setEmail] = useState(info.email);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // 비밀번호
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [nextConfirm, setNextConfirm] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  async function saveProfile() {
    setProfileMsg(null);
    setSavingProfile(true);
    const res = await updateProfile({ name, phone, email });
    setSavingProfile(false);
    setProfileMsg(res.ok ? "저장되었습니다." : (res.error ?? "저장 실패"));
    if (res.ok) router.refresh();
  }

  async function savePassword() {
    setPwMsg(null);
    if (next !== nextConfirm) {
      setPwMsg("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    setSavingPw(true);
    const res = await changePassword({ current, next });
    setSavingPw(false);
    setPwMsg(res.ok ? "비밀번호가 변경되었습니다." : (res.error ?? "변경 실패"));
    if (res.ok) {
      setCurrent("");
      setNext("");
      setNextConfirm("");
    }
  }

  return (
    <div className="flex flex-col gap-10 pt-2">
      <div className="flex flex-col gap-2.5">
        <p className="text-base font-normal text-[#767676]">내 계정 관리</p>
        <h1 className="text-[26px] font-bold leading-9 sm:text-[34px] sm:leading-[46px] lg:text-[40px] lg:leading-[52px] text-black">마이페이지</h1>
      </div>

      {/* 요약 */}
      <div className="flex flex-wrap items-center gap-8 rounded-2xl bg-soft p-8">
        <div className="flex items-center gap-3">
          <span className="h-[52px] w-[52px] rounded-full bg-[#D9D9D9]" />
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-navy">{info.name}</span>
            <span className="text-sm text-gray">@{info.username}</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray">보유잔액</span>
          <span className="text-lg font-semibold text-navy">
            ₩{info.balance.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm text-gray">가입일</span>
          <span className="text-lg font-semibold text-navy">
            {info.createdAt.slice(0, 10).replace(/-/g, ".")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* 내 정보 */}
        <div className="flex flex-col gap-5 rounded-2xl border border-line p-8">
          <h2 className="text-xl font-semibold text-navy">내 정보</h2>
          <Field label="아이디" value={info.username} disabled />
          <Field label="이름" value={name} onChange={setName} />
          <Field label="연락처" value={phone} onChange={setPhone} placeholder="'-' 없이 입력" />
          <Field label="이메일" type="email" value={email} onChange={setEmail} />
          <div className="flex items-center gap-3">
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="rounded-lg bg-navy px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {savingProfile ? "저장 중..." : "저장"}
            </button>
            {profileMsg && <span className="text-sm text-gray">{profileMsg}</span>}
          </div>
        </div>

        {/* 비밀번호 변경 */}
        <div className="flex flex-col gap-5 rounded-2xl border border-line p-8">
          <h2 className="text-xl font-semibold text-navy">비밀번호 변경</h2>
          <Field label="현재 비밀번호" type="password" value={current} onChange={setCurrent} />
          <Field
            label="새 비밀번호"
            type="password"
            value={next}
            onChange={setNext}
            placeholder="8자 이상"
          />
          <Field
            label="새 비밀번호 확인"
            type="password"
            value={nextConfirm}
            onChange={setNextConfirm}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={savePassword}
              disabled={savingPw}
              className="rounded-lg bg-orange px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {savingPw ? "변경 중..." : "비밀번호 변경"}
            </button>
            {pwMsg && <span className="text-sm text-gray">{pwMsg}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
