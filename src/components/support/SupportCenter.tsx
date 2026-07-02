import Link from "next/link";

type Action =
  | { type: "text"; label: string }
  | { type: "tel"; label: string; number: string }
  | { type: "link"; label: string; href: string };

type SupportCard = {
  title: string;
  desc: string;
  action: Action;
};

const cards: SupportCard[] = [
  {
    title: "카카오톡 상담",
    desc: "실시간 채팅으로 가장 빠르게 답변받을 수 있는 채널입니다.",
    action: { type: "text", label: "카카오톡 아이디" },
  },
  {
    title: "전화번호 상담",
    desc: "통화로 자세한 상담을 원하시면 아래 번호로 연락 주세요.",
    action: { type: "tel", label: "010-1234-5678", number: "01012345678" },
  },
  {
    title: "제안서 보기",
    desc: "서비스 구성과 가격이 정리된 제안서를 확인해 보세요.",
    action: { type: "link", label: "자세히 보기", href: "/guide" },
  },
  {
    title: "포트폴리오 확인",
    desc: "그동안 진행한 마케팅 성과와 사례를 모아두었습니다.",
    action: { type: "link", label: "자세히 보기", href: "/blog" },
  },
];

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
    return (
      <Link href={action.href} className={cls}>
        {action.label}
      </Link>
    );
  return <div className={cls}>{action.label}</div>;
}

export default function SupportCenter() {
  return (
    <div className="flex flex-col gap-8 pt-2">
      {/* 헤더 */}
      <div className="flex flex-col gap-2.5">
        <p className="text-base font-normal text-[#767676]">
          여기서 먼저 답을 찾아보세요.
        </p>
        <h1 className="text-[26px] font-bold leading-9 sm:text-[34px] sm:leading-[46px] lg:text-[40px] lg:leading-[52px] text-black">
          궁금하신게 있으신가요?
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
