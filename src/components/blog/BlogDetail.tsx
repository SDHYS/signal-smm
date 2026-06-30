import Link from "next/link";

export type BlogDetailData = {
  category: string;
  title: string;
  authorName: string;
  date: string;
  views: number;
  content: string;
  tags: string[];
  thumbnailUrl: string | null;
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

export default function BlogDetail({ post }: { post: BlogDetailData }) {
  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col items-center gap-15 pt-8">
      <div className="flex w-full flex-col gap-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-base font-medium text-orange">{post.category}</p>
            <h1 className="text-[32px] font-semibold leading-[42px] text-navy">
              {post.title}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-7 text-sm">
            <Meta label="작성자" value={post.authorName} />
            <Meta label="날짜" value={post.date} />
            <Meta label="조회수" value={post.views.toLocaleString()} />
          </div>
        </div>

        {post.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.thumbnailUrl} alt={post.title} className="h-[440px] w-full rounded-xl object-cover" />
        ) : (
          <div className="h-[440px] w-full rounded-xl bg-navy" />
        )}

        <div className="whitespace-pre-line text-base font-normal leading-[26px] text-gray">
          {post.content}
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            {post.tags.map((t) => (
              <span
                key={t}
                className="rounded bg-white px-6 py-3 text-sm font-medium text-gray-2 outline outline-1 outline-line/70"
              >
                # {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <Link
        href="/blog"
        className="rounded-lg bg-orange px-4 py-5 text-center text-base font-medium text-white transition hover:brightness-95"
        style={{ width: 180 }}
      >
        목록으로
      </Link>
    </div>
  );
}
