import Link from "next/link";
import { ChevronDown, Search } from "lucide-react";

type Inquiry = {
  no: number;
  title: string;
  date: string;
  answered: boolean;
};

// 표시용 샘플 데이터 (추후 DB 연동)
const inquiries: Inquiry[] = [
  { no: 10, title: "제목타이틀입니다.", date: "2026.02.22", answered: true },
  { no: 9, title: "제목타이틀입니다.", date: "2026.02.22", answered: true },
  { no: 8, title: "제목타이틀입니다.", date: "2026.02.22", answered: false },
  { no: 7, title: "제목타이틀입니다.", date: "2026.02.22", answered: false },
  { no: 6, title: "제목타이틀입니다.", date: "2026.02.22", answered: false },
  { no: 5, title: "제목타이틀입니다.", date: "2026.02.22", answered: false },
  { no: 4, title: "제목타이틀입니다.", date: "2026.02.22", answered: false },
  { no: 3, title: "제목타이틀입니다.", date: "2026.02.22", answered: false },
  { no: 2, title: "제목타이틀입니다.", date: "2026.02.22", answered: false },
  { no: 1, title: "제목타이틀입니다.", date: "2026.02.22", answered: false },
];

function StatusPill({ answered }: { answered: boolean }) {
  return (
    <span
      className={`rounded-full px-7 py-3 text-sm font-medium ${
        answered ? "bg-blue text-white" : "bg-soft text-gray"
      }`}
    >
      {answered ? "답변완료" : "답변대기"}
    </span>
  );
}

function FilterButton({ label, width }: { label: string; width: string }) {
  return (
    <button
      className={`flex items-center justify-between rounded-lg px-4 py-5 outline outline-1 outline-line/80 transition hover:outline-line ${width}`}
    >
      <span className="text-base font-normal text-gray">{label}</span>
      <ChevronDown size={20} strokeWidth={1.5} className="text-gray-2" />
    </button>
  );
}

export default function InquiryBoard() {
  return (
    <div className="flex flex-col gap-8 pt-2">
      {/* 헤더 */}
      <div className="flex flex-col gap-2.5">
        <p className="text-base font-normal text-[#767676]">
          담당자에게 직접 질문하기
        </p>
        <h1 className="text-[40px] font-bold leading-[52px] text-black">
          1:1 문의
        </h1>
      </div>

      <div className="flex flex-col gap-6">
        {/* 툴바 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <FilterButton label="최신순" width="w-[180px]" />
            <FilterButton label="제목" width="w-[180px]" />
            <div className="flex w-[380px] max-w-full items-center justify-between rounded-lg px-4 py-5 outline outline-1 outline-line/80">
              <input
                placeholder="검색어를 입력해주세요"
                className="w-full bg-transparent text-base font-normal text-navy placeholder:text-gray focus:outline-none"
              />
              <Search size={20} strokeWidth={1.5} className="shrink-0 text-muted" />
            </div>
          </div>
          <Link
            href="/inquiry/write"
            className="rounded-lg bg-orange px-10 py-5 text-base font-medium text-white transition hover:brightness-95"
          >
            글쓰기
          </Link>
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* 헤더 행 */}
            <div className="flex items-center rounded-t-xl bg-soft text-base font-normal text-gray">
              <div className="w-[120px] py-6 text-center">NO</div>
              <div className="flex-1 py-6 text-center">제목</div>
              <div className="w-[240px] py-6 text-center">작성일</div>
              <div className="w-[200px] py-6 text-center">문의상태</div>
            </div>
            {/* 데이터 행 */}
            {inquiries.map((q) => (
              <Link
                key={q.no}
                href={`/inquiry/${q.no}`}
                className="flex items-center border-b border-line transition hover:bg-soft/50"
              >
                <div className="w-[120px] px-6 py-8 text-center text-base font-normal text-navy">
                  No.{q.no}
                </div>
                <div className="flex-1 px-6 py-8 text-lg font-medium text-navy">
                  {q.title}
                </div>
                <div className="w-[240px] px-6 py-8 text-center text-base font-normal text-navy">
                  {q.date}
                </div>
                <div className="flex w-[200px] items-center justify-center px-6 py-8">
                  <StatusPill answered={q.answered} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
