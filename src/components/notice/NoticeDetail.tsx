import Link from "next/link";

export type NoticeDetailData = {
  title: string;
  authorName: string;
  date: string;
  views: number;
  content: string;
};

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="font-normal text-gray">{label}</span>
      <span className="h-3 w-px bg-line" />
      <span className="font-medium text-navy">{value}</span>
    </span>
  );
}

export default function NoticeDetail({ notice }: { notice: NoticeDetailData }) {
  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col items-center gap-15 pt-8">
      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-col gap-4">
          <h1 className="text-[22px] font-semibold leading-8 sm:text-[28px] sm:leading-10 lg:text-[32px] lg:leading-[42px] text-navy">
            {notice.title}
          </h1>
          <div className="flex flex-wrap items-center gap-7 text-sm">
            <Meta label="작성자" value={notice.authorName} />
            <Meta label="날짜" value={notice.date} />
            <Meta label="조회수" value={notice.views.toLocaleString()} />
          </div>
        </div>

        <div className="whitespace-pre-line border-y border-line py-9 text-base font-normal leading-[26px] text-gray">
          {notice.content}
        </div>
      </div>

      <Link
        href="/notice"
        className="rounded-lg bg-orange px-4 py-5 text-center text-base font-medium text-white transition hover:brightness-95"
        style={{ width: 180 }}
      >
        목록으로
      </Link>
    </div>
  );
}
