"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const categories = ["전체보기", "인스타그램", "네이버", "유튜브", "틱톡", "업데이트"];

const titles = [
  "[TOP5] 인스타그램 자동 팔로워 늘리기 사이트 5 추천",
  "유튜브 조회수 구매 전 꼭 체크해야 할 중요한 팁",
  "[SNS서포터] 마케팅 자동 서비스 이용가이드",
];

const posts = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1,
  title: titles[i % titles.length],
}));

export default function BlogList() {
  const [cat, setCat] = useState(0);

  return (
    <div className="flex flex-col gap-6 pt-2">
      {/* 헤더 */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2.5">
          <p className="text-base font-normal text-[#767676]">
            SNS 마케팅의 모든 것을 알려드립니다.
          </p>
          <h1 className="text-[40px] font-bold leading-[52px] text-black">
            SNS 서포터 블로그
          </h1>
        </div>

        {/* 카테고리 탭 */}
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

      {/* 블로그 카드 그리드 */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => (
          <Link key={p.id} href={`/blog/${p.id}`} className="flex flex-col overflow-hidden rounded-xl">
            <div className="h-[248px] bg-navy" />
            <div className="flex flex-1 flex-col justify-between gap-8 bg-soft p-7">
              <h2 className="text-[22px] font-semibold leading-8 text-navy">
                {p.title}
              </h2>
              <span className="flex items-center gap-2 text-sm font-medium text-gray">
                자세히 보기
                <ChevronRight size={16} strokeWidth={1.5} className="text-muted" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
