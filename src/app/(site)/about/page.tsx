import Link from "next/link";
import { Zap, ShieldCheck, Users, Headset } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCopy } from "@/lib/copy";

export default async function AboutPage() {
  const copy = await getCopy();
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["site_name", "about_intro"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const siteName = map.site_name ?? "SignalSMM";
  const customIntro = map.about_intro?.trim();

  const values = [
    {
      icon: <Zap size={32} strokeWidth={1.5} className="text-orange" />,
      title: copy.about_value1_title,
      desc: copy.about_value1_desc,
    },
    {
      icon: <Users size={32} strokeWidth={1.5} className="text-blue" />,
      title: copy.about_value2_title,
      desc: copy.about_value2_desc,
    },
    {
      icon: <ShieldCheck size={32} strokeWidth={1.5} className="text-[#04B014]" />,
      title: copy.about_value3_title,
      desc: copy.about_value3_desc,
    },
  ];

  return (
    <div className="flex flex-col gap-16 pt-2">
      {/* 헤더 */}
      <div className="flex flex-col gap-2.5">
        <p className="text-base font-normal text-[#767676]">
          {copy.about_eyebrow}
        </p>
        <h1 className="text-[26px] font-bold leading-9 sm:text-[34px] sm:leading-[46px] lg:text-[40px] lg:leading-[52px] text-black">
          {copy.about_title}
        </h1>
      </div>

      {/* 소개 */}
      <section className="flex flex-col gap-6 rounded-2xl bg-soft p-10">
        <h2 className="text-xl font-bold leading-7 sm:text-[26px] sm:leading-9 lg:text-[28px] lg:leading-[38px] text-navy">
          <span className="text-orange">{siteName}</span>
          {copy.about_heading_suffix}
        </h2>
        <p className="max-w-[900px] whitespace-pre-line text-lg font-normal leading-[30px] text-gray">
          {customIntro ||
            `인스타그램 팔로워·좋아요부터 유튜브, 틱톡까지 — ${siteName}는 다양한 플랫폼의 맞춤형 마케팅 서비스를 한 곳에서 제공하는 SNS 마케팅 전문 서비스입니다. 잔액을 충전해두면 필요할 때마다 원하는 서비스를 간편하게 주문할 수 있고, 진행 상황은 주문내역과 알림으로 바로 확인할 수 있습니다.`}
        </p>
      </section>

      {/* 핵심 가치 */}
      <section className="flex flex-col gap-7">
        <h2 className="text-xl font-bold leading-7 sm:text-[26px] sm:leading-9 lg:text-[28px] lg:leading-[38px] text-navy">
          {copy.about_values_title}
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
          <h2 className="text-xl font-semibold text-navy">{copy.about_ops_title}</h2>
        </div>
        <p className="text-base font-normal leading-[26px] text-gray">
          {copy.about_ops}
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
