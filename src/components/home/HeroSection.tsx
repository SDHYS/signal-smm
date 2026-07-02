import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type Card = {
  caption: string;
  title: string;
  href: string;
  bg: string;
  captionColor: string;
  titleColor: string;
  arrowColor: string;
  img: string;
  imgH: number;
};

const cards: Card[] = [
  {
    caption: "우리의 서비스를 더 쉽고 편리하게 활용하는 방법",
    title: "서비스 안내",
    href: "/guide",
    bg: "#EF552B",
    captionColor: "rgba(255,255,255,0.70)",
    titleColor: "#ffffff",
    arrowColor: "#ffffff",
    img: "/banners/서비스안내_메인상단배너아이콘.png",
    imgH: 98,
  },
  {
    caption: "무엇을 도와드릴까요? 편하게 남겨주세요",
    title: "1:1 문의",
    href: "/inquiry",
    bg: "#FFC833",
    captionColor: "rgba(31,35,83,0.70)",
    titleColor: "#1F2353",
    arrowColor: "#ffffff",
    img: "/banners/11문의_메인상단배너아이콘.png",
    imgH: 97,
  },
  {
    caption: "자주 묻는 질문부터 상담까지 한눈에",
    title: "고객센터",
    href: "/support",
    bg: "#52CC8F",
    captionColor: "rgba(31,35,83,0.70)",
    titleColor: "#1F2353",
    arrowColor: "#ffffff",
    img: "/banners/고객센터_메인상단배너아이콘.png",
    imgH: 109,
  },
];

export default function HeroSection({ siteName }: { siteName: string }) {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-base font-normal text-gray">
          인스타그램 좋아요 늘리기로 비즈니스를 성장하세요!
        </p>
        <h1 className="text-[40px] font-bold leading-[1.3]">
          <span className="text-orange">{siteName}</span>
          <span className="text-navy">에 오신것을 환영합니다!</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="relative flex h-[220px] flex-col justify-between overflow-hidden rounded-xl p-8 transition-transform hover:-translate-y-1"
            style={{ background: c.bg }}
          >
            <div className="flex flex-col gap-2">
              <p
                className="text-sm font-normal"
                style={{ color: c.captionColor }}
              >
                {c.caption}
              </p>
              <p
                className="text-[26px] font-semibold leading-9"
                style={{ color: c.titleColor }}
              >
                {c.title}
              </p>
            </div>
            <div className="flex items-end justify-between">
              <ArrowUpRight size={40} style={{ color: c.arrowColor }} strokeWidth={2.5} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.img}
                alt=""
                aria-hidden
                className="w-auto object-contain"
                style={{ height: c.imgH }}
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
