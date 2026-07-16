import Link from "next/link";

type Action =
  | { type: "text"; label: string }
  | { type: "tel"; label: string; number: string }
  | { type: "link"; label: string; href: string; external?: boolean };

type SupportCard = {
  title: string;
  desc: string;
  action: Action;
};

function ActionBox({ action }: { action: Action }) {
  const cls =
    "flex items-center justify-center rounded bg-soft px-4 py-5 text-base font-medium text-navy transition hover:brightness-95";
  if (action.type === "tel")
    return (
      <a href={`tel:${action.number}`} className={cls}>
        {action.label}
      </a>
    );
  if (action.type === "link")
    return action.external ? (
      <a href={action.href} target="_blank" rel="noopener noreferrer" className={cls}>
        {action.label}
      </a>
    ) : (
      <Link href={action.href} className={cls}>
        {action.label}
      </Link>
    );
  return <div className={cls}>{action.label}</div>;
}

export default function SupportCenter({
  kakao,
  phone,
  copy,
}: {
  kakao: string;
  phone: string;
  copy: Record<string, string>;
}) {
  // 카카오: 링크면 채널 열기 버튼, ID면 그대로 표시, 미설정이면 1:1 문의 유도
  const kakaoAction: Action = !kakao
    ? { type: "link", label: "1:1 문의 바로가기", href: "/inquiry" }
    : /^https?:\/\//i.test(kakao)
      ? { type: "link", label: "카카오톡 채널 열기", href: kakao, external: true }
      : { type: "text", label: kakao };

  const phoneAction: Action = phone
    ? { type: "tel", label: phone, number: phone.replace(/[^0-9+]/g, "") }
    : { type: "link", label: "1:1 문의 바로가기", href: "/inquiry" };

  const cards: SupportCard[] = [
    {
      title: "카카오톡 상담",
      desc: copy.support_kakao_desc,
      action: kakaoAction,
    },
    {
      title: "전화번호 상담",
      desc: copy.support_phone_desc,
      action: phoneAction,
    },
    {
      title: "제안서 보기",
      desc: copy.support_proposal_desc,
      action: { type: "link", label: "자세히 보기", href: "/guide" },
    },
    {
      title: "포트폴리오 확인",
      desc: copy.support_portfolio_desc,
      action: { type: "link", label: "자세히 보기", href: "/blog" },
    },
  ];

  return (
    <div className="flex flex-col gap-8 pt-2">
      {/* 헤더 */}
      <div className="flex flex-col gap-2.5">
        <p className="text-base font-normal text-[#767676]">
          {copy.support_eyebrow}
        </p>
        <h1 className="text-[26px] font-bold leading-9 sm:text-[34px] sm:leading-[46px] lg:text-[40px] lg:leading-[52px] text-black">
          {copy.support_title}
        </h1>
      </div>

      {/* 상담 카드 2x2 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {cards.map((c) => (
          <div
            key={c.title}
            className="flex flex-col gap-9 rounded-2xl border border-line p-8"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold leading-[34px] text-navy">
                {c.title}
              </h2>
              <p className="text-base font-normal leading-6 text-gray">{c.desc}</p>
            </div>
            <ActionBox action={c.action} />
          </div>
        ))}
      </div>
    </div>
  );
}
