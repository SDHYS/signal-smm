import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";

type Notice = { no: number; title: string; date: string };

const TOTAL = 52;

// 표시용 샘플 (추후 DB 연동)
const notices: Notice[] = Array.from({ length: 10 }, (_, i) => ({
  no: TOTAL - i,
  title: "제목타이틀입니다.",
  date: "2026.02.22",
}));

export default function NoticeBoard() {
  return (
    <div className="flex flex-col gap-8 pt-2">
      {/* 헤더 */}
      <div className="flex flex-col gap-2.5">
        <p className="text-base font-normal text-[#767676]">
          주요 서비스 소식 및 안내 확인
        </p>
        <h1 className="text-[40px] font-bold leading-[52px] text-black">
          공지사항
        </h1>
      </div>

      <div className="flex flex-col gap-4">
        {/* 툴바 */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="flex items-center gap-1 text-lg">
            <span className="font-normal text-gray">Total</span>
            <span className="font-medium text-orange">{TOTAL}</span>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex w-[180px] items-center justify-between rounded-lg px-4 py-5 outline outline-1 outline-line/80 transition hover:outline-line">
              <span className="text-base font-normal text-gray">제목</span>
              <ChevronDown size={20} strokeWidth={1.5} className="text-gray-2" />
            </button>
            <div className="flex w-[380px] max-w-full items-center justify-between rounded-lg px-4 py-5 outline outline-1 outline-line/80">
              <input
                placeholder="검색어를 입력해주세요"
                className="w-full bg-transparent text-base font-normal text-navy placeholder:text-gray focus:outline-none"
              />
              <Search size={20} strokeWidth={1.5} className="shrink-0 text-muted" />
            </div>
          </div>
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto">
          <div className="min-w-[760px] border-t border-navy">
            {notices.map((n) => (
              <Link
                key={n.no}
                href={`/notice/${n.no}`}
                className="flex items-center border-b border-line transition hover:bg-soft/50"
              >
                <div className="w-[120px] px-6 py-8 text-center text-base font-normal text-orange">
                  No.{n.no}
                </div>
                <div className="flex-1 px-6 py-8 text-lg font-medium text-navy">
                  {n.title}
                </div>
                <div className="w-[160px] px-6 py-8 text-center text-base font-normal text-gray">
                  {n.date}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
