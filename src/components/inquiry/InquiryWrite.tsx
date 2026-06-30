"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createInquiry } from "@/app/actions/inquiry";

export default function InquiryWrite() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setSaving(true);
    const res = await createInquiry({ title, content });
    setSaving(false);
    if (res.ok) {
      router.push("/inquiry");
      router.refresh();
    } else setError(res.error ?? "등록 실패");
  }

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8 pt-2">
      <h1 className="text-[32px] font-bold leading-[42px] text-navy">1:1 문의 작성</h1>
      <div className="flex flex-col gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력해주세요"
          className="w-full rounded-lg border border-line bg-white px-6 py-5 text-base text-navy placeholder:text-gray focus:border-blue focus:outline-none"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="문의 내용을 입력해주세요"
          rows={10}
          className="w-full resize-y rounded-lg border border-line bg-white px-6 py-5 text-base text-navy placeholder:text-gray focus:border-blue focus:outline-none"
        />
        {error && <p className="text-sm font-medium text-[#ED1C24]">{error}</p>}
        <div className="flex items-center gap-3">
          <Link
            href="/inquiry"
            className="rounded-lg bg-soft px-8 py-4 text-base font-medium text-gray"
          >
            취소
          </Link>
          <button
            onClick={submit}
            disabled={saving}
            className="rounded-lg bg-orange px-8 py-4 text-base font-medium text-white disabled:opacity-60"
          >
            {saving ? "등록 중..." : "문의 등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
