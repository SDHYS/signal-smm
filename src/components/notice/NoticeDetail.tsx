import Link from "next/link";

const paragraphs = [
  "\"싼 게 비지떡\"이라는 말처럼, 저렴한 유튜브 조회수 상품은 대부분 시간이 지나면 큰 문제가 발생할 수 있습니다. 처음에는 저렴한 가격에 유입된 조회수가 일시적으로는 만족스러울 수 있지만, 유지되지 않고 이탈할 가능성이 큽니다. 특히, A/S 기간이 끝난 후에는 조회수의 대부분이 사라지는 경우가 많아 문제가 발생하더라도 해결하기 어려울 수 있습니다.",
  "이를 방지하기 위해서는 구매한 조회수가 실제로 통계에 정상적으로 반영되는지 반드시 확인해야 합니다. 또한 유입된 경로와 국가를 면밀하게 체크하여 유효한 조회수인지 확인하는 것도 중요합니다. 조회수가 단순히 숫자만 높이는 것이 아니라, 실제로 콘텐츠와 상호작용하는 유저들로부터 얻어지는 것인지 꼼꼼히 살펴보세요.",
  "조회수의 품질은 채널 전체의 신뢰도와 직결됩니다. 비정상적인 유입은 알고리즘에 부정적인 신호를 줄 수 있으므로, 자연스러운 도달과 함께 가는 전략이 필요합니다.",
  "이러한 과정은 일시적인 조회수 증가보다는 장기적인 성장을 위한 중요한 전략입니다.",
];

export default function NoticeDetail({ no }: { no: string }) {
  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col items-center gap-15 pt-8">
      <div className="flex w-full flex-col gap-4">
        {/* 제목 + 메타 */}
        <div className="flex flex-col gap-4">
          <h1 className="text-[32px] font-semibold leading-[42px] text-navy">
            공지사항 디테일 페이지
          </h1>
          <div className="flex flex-wrap items-center gap-7 text-sm">
            <Meta label="작성자" value="너바나" />
            <Meta label="날짜" value="26.02.13" />
            <Meta label="조회수" value="1,222" />
          </div>
        </div>

        {/* 본문 */}
        <div className="flex flex-col gap-6 border-y border-line py-9">
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-base font-normal leading-6 text-gray"
            >
              {p}
            </p>
          ))}
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="font-normal text-gray">{label}</span>
      <span className="h-3 w-px bg-line" />
      <span className="font-medium text-navy">{value}</span>
    </span>
  );
}
