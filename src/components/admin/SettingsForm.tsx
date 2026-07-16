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
                <input
                  id={f.key}
                  value={values[f.key]}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full rounded border border-line px-4 py-3 text-sm text-navy placeholder:text-gray focus:border-blue focus:outline-none"
                />
              )}
              {f.hint && <span className="text-xs text-gray">{f.hint}</span>}
            </div>
          ))}
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="self-start rounded-lg bg-navy px-8 py-3.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "저장 중..." : "전체 저장"}
        </button>
        {msg && <span className="text-sm text-gray">{msg}</span>}
      </div>
    </div>
  );
}
