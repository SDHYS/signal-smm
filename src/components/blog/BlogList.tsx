"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type BlogCard = {
  id: string;
  title: string;
  category: string;
  thumbnailUrl: string | null;
};

const categories = ["전체보기", "인스타그램", "네이버", "유튜브", "틱톡", "업데이트"];

export default function BlogList({
  eyebrow,
  posts,
}: {
  eyebrow: string;
  posts: BlogCard[];
}) {
  const [cat, setCat] = useState(0);
  const selected = categories[cat];
  const visible = cat === 0 ? posts : posts.filter((p) => p.category === selected);

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2.5">
          <p className="text-base font-normal text-[#767676]">{eyebrow}</p>
          <h1 className="text-[26px] font-bold leading-9 sm:text-[34px] sm:leading-[46px] lg:text-[40px] lg:leading-[52px] text-black">
            SNS 서포터 블로그
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {categories.map((c, i) => {
            const active = i === cat;
            return (
              <button
                key={c}
                onClick={() => setCat(i)}
                className={`rounded-full px-6 py-3 text-sm font-medium transition ${
                  active ? "bg-blue text-white" : "bg-white text-gray-2 hover:bg-soft"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl bg-soft p-8 text-base text-gray">
          등록된 글이 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <Link key={p.id} href={`/blog/${p.id}`} className="flex flex-col overflow-hidden rounded-xl">
              {p.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.thumbnailUrl} alt={p.title} className="h-[248px] w-full object-cover" />
              ) : (
                <div className="h-[248px] bg-navy" />
              )}
              <div className="flex flex-1 flex-col justify-between gap-8 bg-soft p-7">
                <h2 className="text-[22px] font-semibold leading-8 text-navy">{p.title}</h2>
                <span className="flex items-center gap-2 text-sm font-medium text-gray">
                  자세히 보기
                  <ChevronRight size={16} strokeWidth={1.5} className="text-muted" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
