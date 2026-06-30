import Link from "next/link";

const sections = [
  {
    heading: "유튜브 조회수는 저렴할수록 좋은것일까?",
    paras: [
      "\"싼 게 비지떡\"이라는 말처럼, 저렴한 유튜브 조회수 상품은 대부분 시간이 지나면 큰 문제가 발생할 수 있습니다. 처음에는 저렴한 가격에 유입된 조회수가 일시적으로는 만족스러울 수 있지만, 유지되지 않고 이탈할 가능성이 큽니다. 특히, A/S 기간이 끝난 후에는 조회수의 대부분이 사라지는 경우가 많아 문제가 발생하더라도 해결하기 어려울 수 있습니다.",
      "이를 방지하기 위해서는 구매한 조회수가 실제로 통계에 정상적으로 반영되는지 반드시 확인해야 합니다. 또한 유입된 경로와 국가를 면밀하게 체크하여 유효한 조회수인지 확인하는 것도 중요합니다.",
      "이러한 과정은 일시적인 조회수 증가보다는 장기적인 성장을 위한 중요한 전략입니다.",
    ],
  },
  {
    heading: "봇 조회수와 실제 캠페인 조회수의 차이",
    paras: [
      "유튜브 조회수 구매 시, 봇을 이용한 인위적인 방법보다 실제 광고 캠페인을 통해 사용자가 자연스럽게 참여하는 서비스를 선택하는 것이 훨씬 더 유리합니다. 이러한 서비스는 실제 사용자가 동영상에 참여하기 때문에 단순한 조회수 상승을 넘어 구독과 좋아요 같은 추가적인 상호작용도 기대할 수 있습니다.",
      "또한, 조회수가 유입되는 경로도 매우 중요합니다. '알 수 없음'과 같은 불분명한 경로에서 유입되는 조회수는 신뢰하기 어려우므로, 반드시 유튜브 검색, 유튜브 탐색, Google 검색 등 유효하고 안전한 경로를 통해 유입된 조회수인지 통계에서 확인하는 것이 필요합니다.",
    ],
  },
  {
    heading: "유튜브 한국인 조회수를 구매하는것이 좋을까요?",
    paras: [
      "아이돌 뮤직비디오처럼 대량 조회수가 필요한 경우와 달리, 꾸준한 유튜브 알고리즘 성장을 위해서는 같은 국가의 조회수를 구매하는 것이 더욱 효과적입니다. 특히 국내 시장을 타깃으로 할 때, 국내 조회수가 유입되는 것이 중요합니다.",
      "하지만 몇 가지 주의해야 할 사항이 있습니다.",
    ],
  },
];

const tags = ["# 유튜브", "# 구독자", "# 조회수", "# SNS 마케팅"];

export default function BlogDetail({ id }: { id: string }) {
  return (
    <div className="mx-auto flex w-full max-w-[1000px] flex-col items-center gap-15 pt-8">
      <div className="flex w-full flex-col gap-6">
        {/* 헤더 */}
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-base font-medium text-orange">임시타이틀</p>
            <h1 className="text-[32px] font-semibold leading-[42px] text-navy">
              [TOP5] 인스타그램 자동 팔로워 늘리기 사이트 5 추천
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-7 text-sm">
            <Meta label="작성자" value="너바나" />
            <Meta label="날짜" value="26.02.13" />
            <Meta label="조회수" value="1,222" />
          </div>
        </div>

        {/* 대표 이미지 */}
        <div className="h-[440px] w-full rounded-xl bg-navy" />

        {/* 본문 */}
        <div className="flex flex-col gap-12">
          {sections.map((s, i) => (
            <div key={i} className="flex flex-col gap-4">
              <h2 className="text-xl font-medium leading-[30px] text-navy">
                {s.heading}
              </h2>
              <div className="flex flex-col gap-4">
                {s.paras.map((p, j) => (
                  <p key={j} className="text-base font-normal leading-6 text-gray">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {/* 태그 */}
          <div className="flex flex-wrap items-center gap-3">
            {tags.map((t) => (
              <span
                key={t}
                className="rounded bg-white px-6 py-3 text-sm font-medium text-gray-2 outline outline-1 outline-line/70"
              >
                {t}
              </span>
            ))}
          </div>

          {/* 안내 박스 */}
          <div className="flex flex-col gap-3 rounded-xl bg-soft p-10">
            <h3 className="text-xl font-medium leading-[30px] text-navy">
              SNS 마케팅의 모든 것
            </h3>
            <p className="text-base font-normal leading-[26px] text-gray">
              회원가입 이후 SNS서포터에서 24시간 언제든 원하는 마케팅 상품을 간편하게
              주문하세요. 인스타그램 팔로워 늘리기부터 유튜브, 페이스북까지 다양한
              플랫폼의 맞춤형 마케팅 서비스를 제공하고 있습니다.
            </p>
          </div>
        </div>
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

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="font-normal text-gray">{label}</span>
      <span className="h-3 w-px bg-line" />
      <span className="font-medium text-navy">{value}</span>
    </span>
  );
}
