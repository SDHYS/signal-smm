import Link from "next/link";

export type NoticeRow = { id: string; title: string; date: string };

export default function NoticeBoard({
  notices,
  total,
}: {
  notices: NoticeRow[];
  total: number;
}) {
  return (
    <div className="flex flex-col gap-8 pt-2">
      <div className="flex flex-col gap-2.5">
        <p className="text-base font-normal text-[#767676]">
          주요 서비스 소식 및 안내 확인
        </p>
        <h1 className="text-[40px] font-bold leading-[52px] text-black">공지사항</h1>
      </div>

      <div className="flex flex-col gap-4">
        <p className="flex items-center gap-1 text-lg">
          <span className="font-normal text-gray">Total</span>
          <span className="font-medium text-orange">{total}</span>
        </p>

        <div className="overflow-x-auto">
          <div className="min-w-[760px] border-t border-navy">
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
                  <div className="w-[120px] px-6 py-8 text-center text-base font-normal text-orange">
                    No.{total - i}
                  </div>
                  <div className="flex-1 px-6 py-8 text-lg font-medium text-navy">
                    {n.title}
                  </div>
                  <div className="w-[160px] px-6 py-8 text-center text-base font-normal text-gray">
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
