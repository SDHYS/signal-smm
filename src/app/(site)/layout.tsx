import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, siteNameRow] = await Promise.all([
    getCurrentUser(),
    prisma.setting.findUnique({ where: { key: "site_name" } }),
  ]);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user} siteName={siteNameRow?.value ?? "SignalSMM"} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} />
        <main className="mx-auto w-full max-w-[1380px] px-4 pb-24 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
