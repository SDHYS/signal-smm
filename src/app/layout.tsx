import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SignalSMM — 소셜미디어 마케팅",
  description:
    "인스타그램 팔로워, 유튜브, 틱톡 등 SNS 마케팅 서비스를 간편하게 주문하세요.",
};

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
