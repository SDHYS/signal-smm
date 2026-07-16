import Link from "next/link";
import { Search } from "lucide-react";

export type NoticeRow = { id: string; title: string; date: string };

export default function NoticeBoard({
  eyebrow,
  notices,
  total,
  q,
}: {
  eyebrow: string;
  notices: NoticeRow[];
  total: number;
  q?: string;
}) {
  return (
    <div className="flex flex-col gap-8 pt-2">
      <div className="flex flex-col gap-2.5">
        <p className="text-base font-normal text-[#767676]">{eyebrow}</p>
        <h1 className="text-[26px] font-bold leading-9 sm:text-[34px] sm:leading-[46px] lg:text-[40px] lg:leading-[52px] text-black">공지사항</h1>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="flex items-center gap-1 text-lg">
            <span className="font-normal text-gray">Total</span>
            <span className="font-medium text-orange">{total}</span>
          </p>
          <form method="GET" className="flex w-[380px] max-w-full items-center justify-between rounded-lg px-4 py-4 outline outline-1 outline-line/80">
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="검색어를 입력해주세요"
              className="w-full bg-transparent text-base font-normal text-navy placeholder:text-gray focus:outline-none"
            />
            <button type="submit" aria-label="검색">
              <Search size={20} strokeWidth={1.5} className="shrink-0 text-muted" />
            </button>
          </form>
        </div>
        {q?.trim() && (
          <p className="text-sm text-gray">
            &quot;{q}&quot; 검색 결과 {notices.length}건 ·{" "}
            <Link href="/notice" className="text-navy underline">
              전체 보기
            </Link>
          </p>
        )}

        <div className="overflow-x-auto">
          <div className="border-t border-navy">
            {notices.length === 0 ? (
              <p className="px-6 py-10 text-center text-base text-gray">
                등록된 공지사항이 없습니다.
              </p>
            ) : (
              notices.map((n, i) => (
                <Link
                  key={n.id}
                  href={`/notice/${n.id}`}
                  className="flex items-center border-b border-line transition hover:bg-soft/50"
                >
                  <div className="hidden w-[120px] px-6 py-8 text-center text-base font-normal text-orange sm:block">
                    No.{total - i}
                  </div>
                  <div className="flex-1 px-4 py-6 text-base font-medium text-navy sm:px-6 sm:py-8 sm:text-lg">
                    {n.title}
                  </div>
                  <div className="w-[104px] shrink-0 px-2 py-6 text-center text-sm font-normal text-gray sm:w-[160px] sm:px-6 sm:py-8 sm:text-base">
                    {n.date}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
