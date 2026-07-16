import Sidebar from "@/components/layout/Sidebar";
import TopBar, { type TopBarNotification } from "@/components/layout/TopBar";
import Footer from "@/components/layout/Footer";
import { getCurrentUser } from "@/lib/auth";
import { getCompanyInfo, getLogoUrl, getThemeColors } from "@/lib/settings";
import { getCopy } from "@/lib/copy";
import { prisma } from "@/lib/prisma";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  const [siteNameRow, company, logoUrl, theme, copy, rows, unreadCount] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "site_name" } }),
    getCompanyInfo(),
    getLogoUrl(),
    getThemeColors(),
    getCopy(),
    user
      ? prisma.notification.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
      : Promise.resolve([]),
    user
      ? prisma.notification.count({ where: { userId: user.id, read: false } })
      : Promise.resolve(0),
  ]);

  const notifications: TopBarNotification[] = rows.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));

  // 어드민 테마 색상 → CSS 변수 오버라이드 (설정 없으면 기본 테마)
  const themeVars = [
    theme.orange && `--color-orange:${theme.orange}`,
    theme.orangeSoft && `--color-orange-soft:${theme.orangeSoft}`,
    theme.orangeDeep && `--color-orange-deep:${theme.orangeDeep}`,
    theme.navy && `--color-navy:${theme.navy}`,
    theme.blue && `--color-blue:${theme.blue}`,
    theme.blueSoft && `--color-blue-soft:${theme.blueSoft}`,
  ].filter(Boolean).join(";");

  return (
    <div className="flex min-h-screen bg-white">
      {themeVars && (
        <style
          // 테마는 관리자 저장값에서만 오며 hex 검증을 통과한 값만 포함된다
          dangerouslySetInnerHTML={{ __html: `:root{${themeVars}}` }}
        />
      )}
      <Sidebar user={user} siteName={siteNameRow?.value ?? "SIGNAL SMM"} logoUrl={logoUrl} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          user={user}
          siteName={siteNameRow?.value ?? "SIGNAL SMM"}
          notifications={notifications}
          unreadCount={unreadCount}
          logoUrl={logoUrl}
        />
        <main className="mx-auto w-full max-w-[1380px] flex-1 px-4 pb-24 sm:px-8">
          {children}
        </main>
        <Footer siteName={siteNameRow?.value ?? "SIGNAL SMM"} company={company} copyright={copy.footer_copyright} />
      </div>
    </div>
  );
}
