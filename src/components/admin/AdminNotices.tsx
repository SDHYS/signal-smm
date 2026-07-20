"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNotice, deleteNotice } from "@/app/actions/notice";

export type NoticeItem = { id: string; title: string; views: number; date: string };

export default function AdminNotices({ notices }: { notices: NoticeItem[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setSaving(true);
    const res = await createNotice({ title, content });
    setSaving(false);
    if (res.ok) {
      setTitle("");
      setContent("");
      router.refresh();
    } else setError(res.error ?? "등록 실패");
  }

  async function remove(id: string) {
    await deleteNotice(id);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-navy">공지사항 관리</h1>
      </div>

      {/* 작성 */}
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className="w-full rounded border border-line px-4 py-3 text-sm text-navy focus:border-blue focus:outline-none"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용"
          rows={5}
          className="w-full resize-y rounded border border-line px-4 py-3 text-sm text-navy focus:border-blue focus:outline-none"
        />
        <div className="flex items-center justify-end gap-3">
          {error && <span className="text-sm text-[#ED1C24]">{error}</span>}
          <button
            onClick={submit}
            disabled={saving}
            className="rounded-lg bg-navy px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "등록 중..." : "공지 등록"}
          </button>
        </div>
      </div>

      {/* 목록 */}
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {notices.length === 0 ? (
          <p className="p-8 text-base text-gray">등록된 공지가 없습니다.</p>
        ) : (
          notices.map((n) => (
            <div key={n.id} className="flex items-center justify-between gap-4 border-b border-line px-6 py-4 last:border-0">
              <div className="flex flex-col">
                <span className="font-medium text-navy">{n.title}</span>
                <span className="text-sm text-gray">조회 {n.views} · {n.date}</span>
              </div>
              <button
                onClick={() => remove(n.id)}
                className="rounded border border-line px-3 py-2 text-xs font-medium text-gray hover:bg-soft"
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
