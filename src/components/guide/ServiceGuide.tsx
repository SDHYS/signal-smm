"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SiInstagram } from "react-icons/si";

const platformTabs = ["인스타그램", "유튜브", "페이스북", "틱톡"];

const serviceCards = [
  {
    title: "인스타 팔로워",
    desc: "한국인 실사용자가 자연스럽게 늘어납니다. 성별·연령 타겟팅은 물론, 90일간 A/S 리필까지 확실히 보장합니다.",
  },
  {
    title: "인스타 좋아요",
    desc: "게시물 노출과 도달률을 한 번에! 최저 0.5원부터 시작하는 좋아요 서비스와 편리한 자동 좋아요 옵션까지 만나보세요.",
  },
  {
    title: "인스타 인기게시물",
    desc: "인기 게시물 상위 노출로 해시태그 검색 최상단을 점유하세요. 좋아요, 도달, 인사이트를 종합 부스팅하여 자연 유입을 극대화",
  },
];

const effects = [
  {
    label: "상품효과 01",
    title: "인스타 팔로워 구매 효과",
    desc: "인스타 팔로워 구매는 계정의 첫인상을 결정합니다. 팔로워 수가 많은 계정은 신규 방문자에게 신뢰감을 주고, 인스타그램 알고리즘이 콘텐츠를 더 넓은 범위에 노출시키는 계기가 됩니다.",
  },
  {
    label: "상품효과 02",
    title: "인스타 좋아요 구매 효과",
    desc: "인스타 좋아요는 게시물의 품질 신호입니다. 좋아요가 많은 게시물은 알고리즘에 의해 더 많은 사용자의 피드와 탐색 탭에 노출되어 자연 도달률이 크게 향상됩니다.",
  },
  {
    label: "상품효과 03",
    title: "인스타그램 비즈니스 성장 효과",
    desc: "팔로워와 좋아요의 시너지 효과로 인스타그램 계정이 종합적으로 성장합니다. 브랜드 인지도, 매출, 협업 기회까지 비즈니스 전반의 성과를 끌어올릴 수 있습니다.",
  },
];

const faqs = [
  {
    q: "주문 후 작업은 언제 시작되나요?",
    a: "결제(입금) 확인 후 평균 5~20분 내로 자동으로 작업이 시작됩니다.",
  },
  {
    q: "비공개 계정도 가능한가요?",
    a: "비공개 계정은 작업이 불가능합니다. 작업 시작 전 공개 계정으로 전환해 주세요.",
  },
  {
    q: "팔로워가 빠지면 어떻게 하나요?",
    a: "90일간 A/S 리필을 보장합니다. 감소분이 발생하면 고객센터로 문의해 주세요.",
  },
  {
    q: "주문을 취소할 수 있나요?",
    a: "작업이 시작되기 전이라면 취소가 가능합니다. 시작 이후에는 취소가 어렵습니다.",
  },
  {
    q: "세금계산서 발행이 되나요?",
    a: "사업자 회원은 세금계산서 발행이 가능합니다. 1:1 문의로 사업자 정보를 남겨주세요.",
  },
];

function ImageBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative flex h-[360px] items-center justify-center overflow-hidden rounded-2xl bg-soft ${className}`}
    >
      <div className="h-[72%] w-[55%] rounded-lg bg-white shadow-[8px_8px_16px_rgba(0,0,0,0.12)]" />
    </div>
  );
}

export default function ServiceGuide() {
  const [tab, setTab] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-12 pt-2">
      {/* 헤더 */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2.5">
          <p className="text-base font-normal text-[#767676]">임시타이틀</p>
          <h1 className="text-[40px] font-bold leading-[52px] text-black">
            서비스 안내 및 주문 방법
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
                className={`flex-1 px-2 py-4 text-center text-lg transition ${
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
            <h2 className="text-[28px] font-bold leading-[38px] text-navy">
              서비스 안내
            </h2>
            <p className="text-lg font-normal leading-[26px] text-gray">
              한국인 인스타 팔로워 구매, 인스타그램 좋아요 늘리기 비즈니스 성장을
              시작하세요
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {serviceCards.map((c) => (
              <div key={c.title} className="overflow-hidden rounded-xl">
                <div className="flex h-[248px] items-center justify-center bg-navy">
                  <SiInstagram className="text-6xl text-white/90" />
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
              <div className="w-full p-4 sm:p-8 lg:w-1/2">
                <div className="flex flex-col gap-5">
                  <p className="text-xl font-medium leading-[30px] text-orange">
                    {e.label}
                  </p>
                  <div className="flex flex-col gap-3">
                    <h3 className="text-[32px] font-bold leading-[46px] text-navy">
                      {e.title}
                    </h3>
                    <p className="text-lg font-normal leading-[26px] text-gray">
                      {e.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
            const Image = <ImageBox className="w-full lg:w-1/2" />;
            return (
              <div
                key={e.label}
                className="flex flex-col items-center gap-8 lg:flex-row lg:gap-20"
              >
                {imageLeft ? (
                  <>
                    {Image}
                    {Text}
                  </>
                ) : (
                  <>
                    {Text}
                    {Image}
                  </>
                )}
              </div>
            );
          })}
        </section>

        {/* 자주묻는질문 */}
        <section className="flex flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h2 className="text-[28px] font-bold leading-[38px] text-navy">
              자주묻는질문
            </h2>
            <p className="text-lg font-normal leading-[26px] text-gray">
              한국인 인스타 팔로워 구매, 인스타그램 좋아요 늘리기 비즈니스 성장을
              시작하세요
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
