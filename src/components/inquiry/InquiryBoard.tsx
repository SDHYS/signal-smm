import Link from "next/link";
import { Search } from "lucide-react";

export type InquiryRow = {
  id: string;
  no: number;
  title: string;
  date: string;
  answered: boolean;
};

function StatusPill({ answered }: { answered: boolean }) {
  return (
    <span
      className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium sm:px-7 sm:py-3 sm:text-sm ${
        answered ? "bg-blue text-white" : "bg-soft text-gray"
      }`}
    >
      {answered ? "답변완료" : "답변대기"}
    </span>
  );
}

export default function InquiryBoard({
  eyebrow,
  isLoggedIn,
  inquiries,
  q,
}: {
  eyebrow: string;
  isLoggedIn: boolean;
  inquiries: InquiryRow[];
  q?: string;
}) {
  return (
    <div className="flex flex-col gap-8 pt-2">
      <div className="flex flex-col gap-2.5">
        <p className="text-base font-normal text-[#767676]">{eyebrow}</p>
        <h1 className="text-[26px] font-bold leading-9 sm:text-[34px] sm:leading-[46px] lg:text-[40px] lg:leading-[52px] text-black">1:1 문의</h1>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <form method="GET" className="flex w-[380px] max-w-full items-center justify-between rounded-lg px-4 py-4 outline outline-1 outline-line/80">
            <input
              name="q"
              aria-label="문의 검색어"
              defaultValue={q ?? ""}
              placeholder="검색어를 입력해주세요"
              className="w-full bg-transparent text-base font-normal text-navy placeholder:text-gray focus:outline-none"
            />
            <button type="submit" aria-label="검색">
              <Search size={20} strokeWidth={1.5} className="shrink-0 text-muted" />
            </button>
          </form>
          <Link
            href="/inquiry/write"
            className="rounded-lg bg-orange px-10 py-5 text-base font-medium text-white transition hover:brightness-95"
          >
            글쓰기
          </Link>
        </div>
        {q?.trim() && (
          <p className="-mt-3 text-sm text-gray">
            &quot;{q}&quot; 검색 결과 {inquiries.length}건 ·{" "}
            <Link href="/inquiry" className="text-navy underline">
              전체 보기
            </Link>
          </p>
        )}

        {!isLoggedIn ? (
          <div className="flex items-center justify-between gap-4 rounded-xl bg-soft px-6 py-5">
            <span className="text-base font-medium text-navy">
              로그인 후 1:1 문의를 작성·확인할 수 있습니다.
            </span>
            <Link href="/login" className="shrink-0 whitespace-nowrap rounded-lg bg-blue px-6 py-3 text-sm font-medium text-white">
              로그인
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div>
              <div className="flex items-center rounded-t-xl bg-soft text-base font-normal text-gray">
                <div className="hidden w-[120px] py-6 text-center sm:block">NO</div>
                <div className="flex-1 py-6 text-center">제목</div>
                <div className="hidden w-[160px] py-6 text-center md:block lg:w-[240px]">작성일</div>
                <div className="w-[104px] py-6 text-center sm:w-[200px]">문의상태</div>
              </div>
              {inquiries.length === 0 ? (
                <p className="border-b border-line px-6 py-10 text-center text-base text-gray">
                  작성한 문의가 없습니다.
                </p>
              ) : (
                inquiries.map((q) => (
                  <Link
                    key={q.id}
                    href={`/inquiry/${q.id}`}
                    className="flex items-center border-b border-line transition hover:bg-soft/50"
                  >
                    <div className="hidden w-[120px] px-6 py-8 text-center text-base font-normal text-navy sm:block">
                      No.{q.no}
                    </div>
                    <div className="flex-1 px-4 py-6 text-base font-medium text-navy sm:px-6 sm:py-8 sm:text-lg">
                      {q.title}
                    </div>
                    <div className="hidden w-[160px] px-6 py-8 text-center text-base font-normal text-navy md:block lg:w-[240px]">
                      {q.date}
                    </div>
                    <div className="flex w-[104px] shrink-0 items-center justify-center px-1 py-6 sm:w-[200px] sm:px-6 sm:py-8">
                      <StatusPill answered={q.answered} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
