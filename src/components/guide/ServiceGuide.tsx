"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// 서비스 안내 카드 일러스트 (디자인 치수 기준 높이)
const cardImages = [
  { src: "/banners/서비스안내상단배너아이콘1.png", h: 172 },
  { src: "/banners/서비스안내상단배너아이콘2.png", h: 177 },
  { src: "/banners/서비스안내상단배너아이콘3.png", h: 129 },
];

// 상품효과 01~03 이미지
const effectImages = [
  "/banners/주문하기_상품효과_1.png",
  "/banners/주문하기_상품효과_2.png",
  "/banners/주문하기_상품효과_3.png",
];

const platformTabs = ["인스타그램", "유튜브", "페이스북", "틱톡"];
// 탭별 지표 용어 (팔로워/좋아요에 해당하는 각 플랫폼 용어)
const terms: Record<string, { f: string; l: string; feed: string }> = {
  인스타그램: { f: "팔로워", l: "좋아요", feed: "피드와 탐색 탭" },
  유튜브: { f: "구독자", l: "조회수", feed: "홈 피드와 추천 영상" },
  페이스북: { f: "팔로워", l: "좋아요", feed: "뉴스피드" },
  틱톡: { f: "팔로워", l: "조회수", feed: "For You 피드" },
};

// 어드민 템플릿 문구의 치환자({플랫폼} 등)를 탭별 용어로 치환
function fill(tmpl: string, p: string) {
  const t = terms[p];
  return tmpl
    .replaceAll("{플랫폼}", p)
    .replaceAll("{팔로워}", t.f)
    .replaceAll("{좋아요}", t.l)
    .replaceAll("{피드}", t.feed);
}

function buildCards(p: string, copy: Record<string, string>) {
  const t = terms[p];
  return [
    { title: `${p} ${t.f}`, desc: fill(copy.guide_card1_desc, p) },
    { title: `${p} ${t.l}`, desc: fill(copy.guide_card2_desc, p) },
    { title: `${p} 인기게시물`, desc: fill(copy.guide_card3_desc, p) },
  ];
}

function buildEffects(p: string, copy: Record<string, string>) {
  const t = terms[p];
  return [
    { label: "상품효과 01", title: `${p} ${t.f} 구매 효과`, desc: fill(copy.guide_effect1_desc, p) },
    { label: "상품효과 02", title: `${p} ${t.l} 구매 효과`, desc: fill(copy.guide_effect2_desc, p) },
    { label: "상품효과 03", title: `${p} 비즈니스 성장 효과`, desc: fill(copy.guide_effect3_desc, p) },
  ];
}



function ImageBox({ src, className = "" }: { src: string; className?: string }) {
  return (
    <div
      className={`relative flex h-[360px] items-center justify-center overflow-hidden rounded-2xl bg-soft ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        className="max-h-[88%] w-auto rounded-lg object-contain shadow-[8px_8px_16px_rgba(0,0,0,0.12)]"
      />
    </div>
  );
}

export default function ServiceGuide({ copy }: { copy: Record<string, string> }) {
  const faqs = [1, 2, 3, 4, 5].map((n) => ({
    q: copy[`guide_faq${n}_q`],
    a: copy[`guide_faq${n}_a`],
  }));
  const [tab, setTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const platform = platformTabs[tab];
  const serviceCards = buildCards(platform, copy);
  const effects = buildEffects(platform, copy);

  return (
    <div className="flex flex-col gap-12 pt-2">
      {/* 헤더 */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2.5">
          <p className="text-base font-normal text-[#767676]">{copy.guide_eyebrow}</p>
          <h1 className="text-[26px] font-bold leading-9 sm:text-[34px] sm:leading-[46px] lg:text-[40px] lg:leading-[52px] text-black">
            {copy.guide_title}
          </h1>
        </div>

        {/* 플랫폼 탭 */}
        <div className="flex border-b border-line">
          {platformTabs.map((t, i) => {
            const active = i === tab;
            return (
              <button
                key={t}
                onClick={() => setTab(i)}
                className={`flex-1 whitespace-nowrap px-1 py-4 text-center text-sm transition sm:px-2 sm:text-lg ${
                  active
                    ? "border-b-[3px] border-[#E97C5E] font-semibold text-[#E97C5E]"
                    : "font-normal text-[#999999] hover:text-navy"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-24">
        {/* 서비스 안내 카드 */}
        <section className="flex flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold leading-7 sm:text-[26px] sm:leading-9 lg:text-[28px] lg:leading-[38px] text-navy">
              서비스 안내
            </h2>
            <p className="text-lg font-normal leading-[26px] text-gray">
              {platform} 마케팅으로 비즈니스 성장을 시작하세요
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {serviceCards.map((c, i) => (
              <div key={c.title} className="overflow-hidden rounded-xl">
                <div className="flex h-[248px] items-center justify-center bg-navy">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={cardImages[i].src}
                    alt=""
                    aria-hidden
                    className="w-auto object-contain"
                    style={{ height: cardImages[i].h }}
                  />
                </div>
                <div className="flex flex-col gap-4 bg-soft p-7">
                  <h3 className="text-[22px] font-semibold leading-8 text-navy">
                    {c.title}
                  </h3>
                  <p className="text-base font-normal leading-6 text-gray">
                    {c.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 상품효과 */}
        <section className="flex flex-col gap-10">
          {effects.map((e, i) => {
            const imageLeft = i % 2 === 1;
            const Text = (
              <div className={`w-full p-4 sm:p-8 lg:w-1/2 ${imageLeft ? "" : "lg:order-1"}`}>
                <div className="flex flex-col gap-5">
                  <p className="text-xl font-medium leading-[30px] text-orange">
                    {e.label}
                  </p>
                  <div className="flex flex-col gap-3">
                    <h3 className="text-[22px] font-bold leading-8 sm:text-[28px] sm:leading-10 lg:text-[32px] lg:leading-[46px] text-navy">
                      {e.title}
                    </h3>
                    <p className="text-lg font-normal leading-[26px] text-gray">
                      {e.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
            const Image = (
              <ImageBox
                src={effectImages[i]}
                className={`w-full lg:w-1/2 ${imageLeft ? "" : "lg:order-2"}`}
              />
            );
            return (
              <div
                key={e.label}
                className="flex flex-col items-center gap-8 lg:flex-row lg:gap-20"
              >
                {Image}
                {Text}
              </div>
            );
          })}
        </section>

        {/* 자주묻는질문 */}
        <section className="flex flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold leading-7 sm:text-[26px] sm:leading-9 lg:text-[28px] lg:leading-[38px] text-navy">
              자주묻는질문
            </h2>
            <p className="text-lg font-normal leading-[26px] text-gray">
              {platform} 마케팅으로 비즈니스 성장을 시작하세요
            </p>
          </div>
          <div className="flex flex-col gap-5">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={i} className="rounded-xl border border-line">
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-7 py-9 text-left"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-xl font-medium leading-[30px] text-orange">
                        Q{i + 1}.
                      </span>
                      <span className="text-xl font-medium leading-[30px] text-navy">
                        {f.q}
                      </span>
                    </span>
                    <ChevronDown
                      size={24}
                      strokeWidth={1.5}
                      className={`shrink-0 text-gray transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {open && (
                    <p className="border-t border-line px-7 py-7 text-base font-normal leading-[26px] text-gray">
                      {f.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
