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

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const pick = (v: string, fallback: string) => (HEX_RE.test(v) ? v : fallback);

const buildCards = (copy: Record<string, string>): Card[] => [
  {
    caption: copy.hero_card1_caption,
    title: copy.hero_card1_title,
    href: copy.hero_card1_href || "/guide",
    bg: pick(copy.hero_card1_color, "#EF552B"),
    captionColor: "rgba(255,255,255,0.70)",
    titleColor: "#ffffff",
    arrowColor: "#ffffff",
    img: "/banners/서비스안내_메인상단배너아이콘.png",
    imgH: 98,
  },
  {
    caption: copy.hero_card2_caption,
    title: copy.hero_card2_title,
    href: copy.hero_card2_href || "/inquiry",
    bg: pick(copy.hero_card2_color, "#FFC833"),
    captionColor: "rgba(31,35,83,0.70)",
    titleColor: "#1F2353",
    arrowColor: "#ffffff",
    img: "/banners/11문의_메인상단배너아이콘.png",
    imgH: 97,
  },
  {
    caption: copy.hero_card3_caption,
    title: copy.hero_card3_title,
    href: copy.hero_card3_href || "/support",
    bg: pick(copy.hero_card3_color, "#52CC8F"),
    captionColor: "rgba(31,35,83,0.70)",
    titleColor: "#1F2353",
    arrowColor: "#ffffff",
    img: "/banners/고객센터_메인상단배너아이콘.png",
    imgH: 109,
  },
];

export default function HeroSection({
  siteName,
  copy,
}: {
  siteName: string;
  copy: Record<string, string>;
}) {
  const cards = buildCards(copy);
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="text-base font-normal text-gray">
          {copy.hero_eyebrow}
        </p>
        <h1 className="text-[26px] font-bold leading-[1.35] sm:text-[32px] lg:text-[40px] lg:leading-[1.3]">
          <span className="text-orange">{siteName}</span>
          <span className="text-navy">{copy.hero_title_suffix}</span>
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
