import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { FaTelegramPlane } from "react-icons/fa";

export default function OrderIntro({
  ticker,
  copy,
}: {
  ticker?: string | null;
  copy: Record<string, string>;
}) {
  return (
    <section className="flex flex-col gap-7">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold leading-7 sm:text-[26px] sm:leading-9 lg:text-[28px] lg:leading-[38px] text-navy">
            {copy.order_title}
          </h2>
          <p className="text-lg font-normal leading-[26px] text-gray">
            {copy.order_desc}
          </p>
        </div>
        <Link
          href="/guide"
          className="flex shrink-0 items-center gap-2 text-sm font-medium text-gray transition-colors hover:text-navy"
        >
          {copy.order_guide_link}
          <ChevronRight size={16} strokeWidth={1.5} className="text-muted" />
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {/* 안내 박스 */}
        <div className="flex items-center justify-between gap-6 rounded-xl bg-soft p-5 sm:py-5 sm:pl-9 sm:pr-15">
          <p className="whitespace-pre-line text-base font-normal leading-[26px] text-navy">
            {copy.order_notice}
          </p>
          <div className="hidden shrink-0 items-center sm:flex">
            <span className="flex h-[108px] w-[108px] items-center justify-center rounded-full bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/banners/주문하기_메인주문하기영역아이콘.png"
                alt=""
                aria-hidden
                className="h-[62px] w-auto object-contain"
              />
            </span>
          </div>
        </div>

        {/* 실시간 주문 티커 */}
        <div className="flex items-center gap-2 rounded-md bg-gradient-to-r from-[#E97C5E] via-[#EF552B] to-[#C23610] p-4">
          <FaTelegramPlane className="shrink-0 text-xl text-white" />
          <p className="truncate text-sm font-medium text-white">
            {ticker ?? copy.ticker_empty}
          </p>
        </div>
      </div>
    </section>
  );
}
