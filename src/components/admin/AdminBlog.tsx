"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBlogPost, deleteBlogPost } from "@/app/actions/blog";

export type BlogItem = { id: string; title: string; category: string; views: number; date: string };

const cats = ["인스타그램", "네이버", "유튜브", "틱톡", "업데이트"];

export default function AdminBlog({ posts }: { posts: BlogItem[] }) {
  const router = useRouter();
  const [category, setCategory] = useState(cats[0]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setSaving(true);
    const res = await createBlogPost({
      category,
      title,
      content,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    setSaving(false);
    if (res.ok) {
      setTitle("");
      setContent("");
      setTags("");
      router.refresh();
    } else setError(res.error ?? "등록 실패");
  }

  async function remove(id: string) {
    await deleteBlogPost(id);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold text-navy">블로그 관리</h1>

      <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-6">
        <div className="flex flex-wrap gap-2">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                category === c ? "bg-blue text-white" : "bg-soft text-gray-2"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
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
          rows={6}
          className="w-full resize-y rounded border border-line px-4 py-3 text-sm text-navy focus:border-blue focus:outline-none"
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="태그 (쉼표로 구분, 예: 유튜브, 조회수)"
          className="w-full rounded border border-line px-4 py-3 text-sm text-navy focus:border-blue focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={submit}
            disabled={saving}
            className="rounded-lg bg-navy px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "등록 중..." : "글 등록"}
          </button>
          {error && <span className="text-sm text-[#ED1C24]">{error}</span>}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {posts.length === 0 ? (
          <p className="p-8 text-base text-gray">등록된 글이 없습니다.</p>
        ) : (
          posts.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4 border-b border-line px-6 py-4 last:border-0">
              <div className="flex flex-col">
                <span className="font-medium text-navy">
                  [{p.category}] {p.title}
                </span>
                <span className="text-sm text-gray">조회 {p.views} · {p.date}</span>
              </div>
              <button
                onClick={() => remove(p.id)}
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
