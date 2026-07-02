import Link from "next/link";
import { ChevronRight, Megaphone } from "lucide-react";
import { FaTelegramPlane } from "react-icons/fa";

export default function OrderIntro() {
  return (
    <section className="flex flex-col gap-7">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-[28px] font-bold leading-[38px] text-navy">
            주문하기
          </h2>
          <p className="text-lg font-normal leading-[26px] text-gray">
            한국인 인스타 팔로워 구매, 인스타그램 좋아요 늘리기 비즈니스 성장을
            시작하세요
          </p>
        </div>
        <Link
          href="/guide"
          className="flex shrink-0 items-center gap-2 text-sm font-medium text-gray transition-colors hover:text-navy"
        >
          신규 가이드 제작하기
          <ChevronRight size={16} strokeWidth={1.5} className="text-muted" />
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        {/* 안내 박스 */}
        <div className="flex items-center justify-between gap-6 rounded-xl bg-soft py-5 pl-9 pr-15">
          <p className="text-base font-normal leading-[26px] text-navy">
            회원가입 이후 SNS서포터에서 24시간 언제든 원하는 마케팅 상품을 간편하게
            주문하세요.
            <br />
            인스타그램 팔로워 늘리기부터 유튜브, 페이스북까지 다양한 플랫폼의
            맞춤형 마케팅 서비스를 제공하고 있습니다.
          </p>
          <div className="hidden shrink-0 items-center gap-4 sm:flex">
            <Megaphone size={44} className="text-blue" strokeWidth={1.5} />
          </div>
        </div>

        {/* 실시간 주문 티커 */}
        <div className="flex items-center gap-2 rounded-md bg-gradient-to-r from-[#E97C5E] via-[#EF552B] to-[#C23610] p-4">
          <FaTelegramPlane className="shrink-0 text-xl text-white" />
          <p className="truncate text-sm font-medium text-white">
            [1시간 25분 전] qj_cb*** 님이 트위터 댓글 300개를 주문했어요!
          </p>
        </div>
      </div>
    </section>
  );
}
