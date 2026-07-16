import Link from "next/link";
import { Zap, ShieldCheck, Users, Headset } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function AboutPage() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["site_name", "about_intro"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const siteName = map.site_name ?? "SignalSMM";
  const customIntro = map.about_intro?.trim();

  const values = [
    {
      icon: <Zap size={32} strokeWidth={1.5} className="text-orange" />,
      title: "빠른 처리",
      desc: "주문 후 평균 5~20분 내 자동으로 작업이 시작됩니다. 24시간 언제든 주문할 수 있습니다.",
    },
    {
      icon: <Users size={32} strokeWidth={1.5} className="text-blue" />,
      title: "실사용자 품질",
      desc: "실제 활동하는 사용자 기반으로 자연스럽게 반영되어 계정 성장에 도움이 됩니다.",
    },
    {
      icon: <ShieldCheck size={32} strokeWidth={1.5} className="text-[#04B014]" />,
      title: "안심 운영",
      desc: "무통장입금 수동 확인과 A/S 리필 정책으로 안전하게 이용할 수 있습니다.",
    },
  ];

  return (
    <div className="flex flex-col gap-16 pt-2">
      {/* 헤더 */}
      <div className="flex flex-col gap-2.5">
        <p className="text-base font-normal text-[#767676]">
          SNS 마케팅 파트너
        </p>
        <h1 className="text-[26px] font-bold leading-9 sm:text-[34px] sm:leading-[46px] lg:text-[40px] lg:leading-[52px] text-black">
          회사 소개
        </h1>
      </div>

      {/* 소개 */}
      <section className="flex flex-col gap-6 rounded-2xl bg-soft p-10">
        <h2 className="text-xl font-bold leading-7 sm:text-[26px] sm:leading-9 lg:text-[28px] lg:leading-[38px] text-navy">
          <span className="text-orange">{siteName}</span>는 SNS 마케팅의 모든 것을
          제공합니다
        </h2>
        <p className="max-w-[900px] whitespace-pre-line text-lg font-normal leading-[30px] text-gray">
          {customIntro ||
            `인스타그램 팔로워·좋아요부터 유튜브, 틱톡까지 — ${siteName}는 다양한 플랫폼의 맞춤형 마케팅 서비스를 한 곳에서 제공하는 SNS 마케팅 전문 서비스입니다. 잔액을 충전해두면 필요할 때마다 원하는 서비스를 간편하게 주문할 수 있고, 진행 상황은 주문내역과 알림으로 바로 확인할 수 있습니다.`}
        </p>
      </section>

      {/* 핵심 가치 */}
      <section className="flex flex-col gap-7">
        <h2 className="text-xl font-bold leading-7 sm:text-[26px] sm:leading-9 lg:text-[28px] lg:leading-[38px] text-navy">
          우리가 일하는 방식
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {values.map((v) => (
            <div
              key={v.title}
              className="flex flex-col gap-4 rounded-2xl border border-line p-8"
            >
              {v.icon}
              <h3 className="text-xl font-semibold text-navy">{v.title}</h3>
              <p className="text-base font-normal leading-6 text-gray">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 운영 안내 + CTA */}
      <section className="flex flex-col gap-6 rounded-2xl border border-line p-10">
        <div className="flex items-center gap-3">
          <Headset size={28} strokeWidth={1.5} className="text-navy" />
          <h2 className="text-xl font-semibold text-navy">운영 안내</h2>
        </div>
        <p className="text-base font-normal leading-[26px] text-gray">
          문의는 1:1 문의 게시판과 고객센터 채널을 통해 접수됩니다. 충전 입금
          확인은 관리자가 순차적으로 처리하며, 완료 시 알림으로 안내드립니다.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/guide"
            className="rounded-lg bg-navy px-8 py-4 text-base font-medium text-white transition hover:opacity-90"
          >
            서비스 안내 보기
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-orange px-8 py-4 text-base font-medium text-white transition hover:brightness-95"
          >
            주문 시작하기
          </Link>
          <Link
            href="/support"
            className="rounded-lg bg-soft px-8 py-4 text-base font-medium text-gray transition hover:text-navy"
          >
            고객센터
          </Link>
        </div>
      </section>
    </div>
  );
}
