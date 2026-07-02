import Sidebar from "@/components/layout/Sidebar";
import TopBar, { type TopBarNotification } from "@/components/layout/TopBar";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  const [siteNameRow, rows, unreadCount] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "site_name" } }),
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

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user} siteName={siteNameRow?.value ?? "SIGNAL SMM"} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} notifications={notifications} unreadCount={unreadCount} />
        <main className="mx-auto w-full max-w-[1380px] px-4 pb-24 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
