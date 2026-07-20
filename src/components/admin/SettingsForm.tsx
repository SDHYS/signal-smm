"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSettings } from "@/app/actions/settings";

type Field = {
  key: string;
  label: string;
  hint?: string;
  placeholder?: string;
  textarea?: boolean;
  color?: boolean; // hex 색상 (픽커 병행)
};

type Section = { title: string; desc: string; fields: Field[] };

const sections: Section[] = [
  {
    title: "기본",
    desc: "사이트 전반에 표시되는 이름입니다.",
    fields: [{ key: "site_name", label: "사이트명", placeholder: "SIGNAL SMM" }],
  },
  {
    title: "입금 계좌",
    desc: "충전 신청 완료 화면에서 고객에게 안내됩니다.",
    fields: [
      { key: "bank_name", label: "입금 은행", placeholder: "예: 국민은행" },
      { key: "bank_account", label: "계좌번호", placeholder: "예: 123456-01-234567" },
      { key: "bank_holder", label: "예금주", placeholder: "예: 주식회사 시그널" },
    ],
  },
  {
    title: "고객센터",
    desc: "고객센터 페이지의 상담 카드에 표시됩니다.",
    fields: [
      {
        key: "support_kakao",
        label: "카카오톡 채널",
        placeholder: "채널 ID 또는 링크 (예: @signalsmm 또는 https://pf.kakao.com/_xxxxx)",
        hint: "http로 시작하는 링크를 넣으면 카드가 바로 채널로 연결됩니다.",
      },
      {
        key: "support_phone",
        label: "고객센터 전화번호",
        placeholder: "예: 010-1234-5678",
        hint: "표시된 그대로 노출되며, 클릭 시 전화 연결됩니다.",
      },
    ],
  },
  {
    title: "회사소개",
    desc: "회사소개(/about) 페이지의 소개 본문입니다. 비워두면 기본 문구가 표시됩니다.",
    fields: [
      {
        key: "about_intro",
        label: "소개 본문",
        textarea: true,
        placeholder:
          "회사 소개 문구를 입력하세요. 줄바꿈이 그대로 반영됩니다.",
      },
    ],
  },
  {
    title: "사업자 정보",
    desc: "사이트 하단(푸터)과 영수증·거래명세서에 표기됩니다. 전자상거래 법정 표기 사항입니다.",
    fields: [
      { key: "company_name", label: "상호", placeholder: "예: 주식회사 시그널" },
      { key: "company_ceo", label: "대표자", placeholder: "예: 홍길동" },
      { key: "company_bizno", label: "사업자등록번호", placeholder: "예: 123-45-67890" },
      { key: "company_mailorder", label: "통신판매업신고번호", placeholder: "예: 제2026-서울강남-0000호" },
      { key: "company_address", label: "사업장 주소", placeholder: "예: 서울특별시 강남구 …" },
      { key: "company_email", label: "대표 이메일", placeholder: "예: contact@signalsmm.com" },
    ],
  },
  {
    title: "이용약관 · 개인정보처리방침",
    desc: "가입 1단계와 푸터에서 열람됩니다. 비워두면 '준비 중' 안내가 표시됩니다.",
    fields: [
      { key: "terms_content", label: "이용약관 전문", textarea: true, placeholder: "제1조 (목적) …" },
      { key: "privacy_content", label: "개인정보처리방침 전문", textarea: true, placeholder: "1. 수집하는 개인정보 항목 …" },
    ],
  },
  {
    title: "브랜딩 · 테마",
    desc: "로고와 사이트 색상을 바꿉니다. 색상을 비우면 기본 테마가 사용됩니다.",
    fields: [
      {
        key: "logo_url",
        label: "로고 이미지 URL",
        placeholder: "/brand/로고텍스트일체형.png 또는 https://…/logo.png",
        hint: "사이드바·모바일 상단·드로어에 사용됩니다. 가로형 PNG 권장.",
      },
      { key: "theme_color_orange", label: "포인트 색상 (버튼·강조)", placeholder: "#EF552B", color: true },
      { key: "theme_color_navy", label: "본문 짙은 색상", placeholder: "#1F2353", color: true },
      { key: "theme_color_blue", label: "보조 색상 (파랑 계열)", placeholder: "#2E82FF", color: true },
    ],
  },
  {
    title: "회원가입 · 결제",
    desc: "가입 경로 선택지와 부가세율을 설정합니다.",
    fields: [
      {
        key: "signup_channels",
        label: "가입 경로 선택지 (쉼표 구분)",
        placeholder: "구글, 네이버, 아이보스, 지인, 인스타",
        hint: "가입 3단계에서 버튼으로 표시됩니다. 최대 12개.",
      },
      {
        key: "vat_rate",
        label: "부가세율 (%)",
        placeholder: "10",
        hint: "0~20 사이 정수. 0이면 부가세 없이 충전 금액만 입금받습니다.",
      },
    ],
  },
  {
    title: "검색엔진(SEO) · 충전",
    desc: "브라우저 탭 제목, 검색 결과 설명, 충전 금액 버튼을 설정합니다.",
    fields: [
      { key: "seo_title", label: "사이트 제목 (브라우저 탭)", placeholder: "예: SignalSMM — 소셜미디어 마케팅" },
      { key: "seo_description", label: "사이트 설명 (검색 결과)", textarea: true, placeholder: "예: 인스타그램 팔로워, 유튜브, 틱톡 등 SNS 마케팅 서비스를 간편하게 주문하세요." },
      {
        key: "charge_presets",
        label: "충전 금액 버튼 (쉼표 구분, 원)",
        placeholder: "10000, 30000, 50000, 70000, 100000, 300000, 500000, 1000000",
        hint: "예: 5000, 10000, 50000 — 잘못된 값은 무시되고 기본 버튼이 사용됩니다.",
      },
    ],
  },
];

export default function SettingsForm({
  initial,
}: {
  initial: Record<string, string>;
}) {
  const router = useRouter();
  const allFields = sections.flatMap((s) => s.fields);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(allFields.map((f) => [f.key, initial[f.key] ?? ""])),
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await updateSettings(values);
    setSaving(false);
    setMsg(res.ok ? "저장되었습니다." : (res.error ?? "저장 실패"));
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex max-w-[680px] flex-col gap-6">
      {sections.map((s) => (
        <div key={s.title} className="flex flex-col gap-5 rounded-xl border border-line bg-white p-8">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-navy">{s.title}</h2>
            <p className="text-sm text-gray">{s.desc}</p>
          </div>
          {s.fields.map((f) => (
            <div key={f.key} className="flex flex-col gap-2">
              <label htmlFor={f.key} className="text-sm font-medium text-navy">{f.label}</label>
              {f.textarea ? (
                <textarea
                  id={f.key}
                  value={values[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  rows={6}
                  className="w-full resize-y rounded border border-line px-4 py-3 text-sm leading-6 text-navy placeholder:text-gray focus:border-blue focus:outline-none"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    id={f.key}
                    value={values[f.key]}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full rounded border border-line px-4 py-3 text-sm text-navy placeholder:text-gray focus:border-blue focus:outline-none"
                  />
                  {f.color && (
                    <input
                      type="color"
                      aria-label={`${f.label} 색상 선택`}
                      value={/^#[0-9a-fA-F]{6}$/.test(values[f.key]) ? values[f.key] : (f.placeholder ?? "#000000")}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      className="h-10 w-12 shrink-0 cursor-pointer rounded border border-line"
                    />
                  )}
                </div>
              )}
              {f.hint && <span className="text-xs text-gray">{f.hint}</span>}
            </div>
          ))}
        </div>
      ))}

      <div className="flex items-center justify-end gap-3">
        {msg && <span className="text-sm text-gray">{msg}</span>}
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-navy px-8 py-3.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "저장 중..." : "전체 저장"}
        </button>
      </div>
    </div>
  );
}
