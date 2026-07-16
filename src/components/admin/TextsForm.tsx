"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateSettings } from "@/app/actions/settings";

export type TextItem = {
  key: string; // copy_ 접두사 제외
  label: string;
  default: string;
  textarea?: boolean;
  hint?: string;
};
export type TextSection = { title: string; page: string; items: TextItem[] };

export default function TextsForm({
  sections,
  saved,
}: {
  sections: TextSection[];
  saved: Record<string, string>; // 저장된 값만 (짧은 키)
}) {
  const router = useRouter();
  const allItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(allItems.map((i) => [i.key, saved[i.key] ?? ""])),
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(sections[0]?.title ?? null);

  const changedCount = allItems.filter(
    (i) => (values[i.key] ?? "") !== (saved[i.key] ?? ""),
  ).length;
  const customCount = allItems.filter((i) => (values[i.key] ?? "").trim() !== "").length;

  async function save() {
    setSaving(true);
    setMsg(null);
    const payload = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [`copy_${k}`, v]),
    );
    const res = await updateSettings(payload);
    setSaving(false);
    setMsg(res.ok ? "저장되었습니다. 사이트에 즉시 반영됩니다." : (res.error ?? "저장 실패"));
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex max-w-[820px] flex-col gap-4">
      {/* 저장 바 (상단 고정) */}
      <div className="sticky top-0 z-10 flex items-center gap-3 rounded-xl border border-line bg-white/95 p-4 backdrop-blur">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-navy px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "저장 중..." : "전체 저장"}
        </button>
        <span className="text-sm text-gray">
          커스텀 {customCount}건{changedCount > 0 && ` · 미저장 변경 ${changedCount}건`}
        </span>
        {msg && <span className="text-sm font-medium text-navy">{msg}</span>}
      </div>

      {sections.map((s) => {
        const isOpen = open === s.title;
        const sectionCustom = s.items.filter((i) => (values[i.key] ?? "").trim() !== "").length;
        return (
          <div key={s.title} className="overflow-hidden rounded-xl border border-line bg-white">
            <button
              onClick={() => setOpen(isOpen ? null : s.title)}
              className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-soft/40"
            >
              <span className="flex items-center gap-3">
                <span className="text-base font-semibold text-navy">{s.title}</span>
                <span className="text-xs text-gray">{s.page}</span>
              </span>
              <span className="flex items-center gap-3 text-xs text-gray">
                {sectionCustom > 0 && (
                  <span className="rounded-full bg-blue/10 px-2 py-0.5 font-medium text-blue">
                    커스텀 {sectionCustom}
                  </span>
                )}
                {s.items.length}개 문구 {isOpen ? "▲" : "▼"}
              </span>
            </button>

            {isOpen && (
              <div className="flex flex-col gap-5 border-t border-line p-6">
                {s.items.map((i) => {
                  const custom = (values[i.key] ?? "").trim() !== "";
                  return (
                    <div key={i.key} className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <label htmlFor={`copy_${i.key}`} className="text-sm font-medium text-navy">
                          {i.label}
                        </label>
                        {custom && (
                          <button
                            onClick={() => setValues((v) => ({ ...v, [i.key]: "" }))}
                            className="text-xs text-gray underline hover:text-navy"
                          >
                            기본값으로
                          </button>
                        )}
                      </div>
                      {i.textarea ? (
                        <textarea
                          id={`copy_${i.key}`}
                          value={values[i.key]}
                          onChange={(e) => setValues((v) => ({ ...v, [i.key]: e.target.value }))}
                          placeholder={i.default}
                          rows={Math.min(6, Math.max(2, i.default.split("\n").length + 1))}
                          className="w-full resize-y rounded border border-line px-4 py-3 text-sm leading-6 text-navy placeholder:text-muted focus:border-blue focus:outline-none"
                        />
                      ) : (
                        <input
                          id={`copy_${i.key}`}
                          value={values[i.key]}
                          onChange={(e) => setValues((v) => ({ ...v, [i.key]: e.target.value }))}
                          placeholder={i.default}
                          className="w-full rounded border border-line px-4 py-3 text-sm text-navy placeholder:text-muted focus:border-blue focus:outline-none"
                        />
                      )}
                      <span className="text-xs text-gray">
                        {i.hint ?? "비워두면 회색으로 보이는 기본 문구가 사용됩니다."}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
