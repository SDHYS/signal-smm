"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSettings } from "@/app/actions/settings";

const fields = [
  { key: "site_name", label: "사이트명" },
  { key: "bank_name", label: "입금 은행" },
  { key: "bank_account", label: "계좌번호" },
  { key: "bank_holder", label: "예금주" },
];

export default function SettingsForm({
  initial,
}: {
  initial: Record<string, string>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, initial[f.key] ?? ""])),
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
    <div className="flex max-w-[560px] flex-col gap-5 rounded-xl border border-line bg-white p-8">
      {fields.map((f) => (
        <div key={f.key} className="flex flex-col gap-2">
          <label className="text-sm font-medium text-navy">{f.label}</label>
          <input
            value={values[f.key]}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            className="w-full rounded border border-line px-4 py-3 text-sm text-navy focus:border-blue focus:outline-none"
          />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-navy px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        {msg && <span className="text-sm text-gray">{msg}</span>}
      </div>
    </div>
  );
}
