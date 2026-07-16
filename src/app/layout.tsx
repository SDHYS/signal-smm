import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import "./globals.css";

// SEO 메타는 어드민 설정(seo_title/seo_description)에서 관리, 미설정 시 기본값
export async function generateMetadata(): Promise<Metadata> {
  try {
    const rows = await prisma.setting.findMany({
      where: { key: { in: ["seo_title", "seo_description", "site_name"] } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value.trim()]));
    return {
      title:
        map.seo_title ||
        `${map.site_name || "SignalSMM"} — 소셜미디어 마케팅`,
      description:
        map.seo_description ||
        "인스타그램 팔로워, 유튜브, 틱톡 등 SNS 마케팅 서비스를 간편하게 주문하세요.",
    };
  } catch {
    // 빌드/DB 불가 시에도 렌더는 유지
    return {
      title: "SignalSMM — 소셜미디어 마케팅",
      description:
        "인스타그램 팔로워, 유튜브, 틱톡 등 SNS 마케팅 서비스를 간편하게 주문하세요.",
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* Pretendard 웹폰트 */}
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-full bg-white">{children}</body>
    </html>
  );
}
