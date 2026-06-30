import Link from "next/link";

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
      className={`rounded-full px-7 py-3 text-sm font-medium ${
        answered ? "bg-blue text-white" : "bg-soft text-gray"
      }`}
    >
      {answered ? "답변완료" : "답변대기"}
    </span>
  );
}

export default function InquiryBoard({
  isLoggedIn,
  inquiries,
}: {
  isLoggedIn: boolean;
  inquiries: InquiryRow[];
}) {
  return (
    <div className="flex flex-col gap-8 pt-2">
      <div className="flex flex-col gap-2.5">
        <p className="text-base font-normal text-[#767676]">담당자에게 직접 질문하기</p>
        <h1 className="text-[40px] font-bold leading-[52px] text-black">1:1 문의</h1>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-end">
          <Link
            href="/inquiry/write"
            className="rounded-lg bg-orange px-10 py-5 text-base font-medium text-white transition hover:brightness-95"
          >
            글쓰기
          </Link>
        </div>

        {!isLoggedIn ? (
          <div className="flex items-center justify-between gap-4 rounded-xl bg-soft px-6 py-5">
            <span className="text-base font-medium text-navy">
              로그인 후 1:1 문의를 작성·확인할 수 있습니다.
            </span>
            <Link href="/login" className="rounded-lg bg-blue px-6 py-3 text-sm font-medium text-white">
              로그인
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="flex items-center rounded-t-xl bg-soft text-base font-normal text-gray">
                <div className="w-[120px] py-6 text-center">NO</div>
                <div className="flex-1 py-6 text-center">제목</div>
                <div className="w-[240px] py-6 text-center">작성일</div>
                <div className="w-[200px] py-6 text-center">문의상태</div>
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
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
