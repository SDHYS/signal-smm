import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { getCurrentUser } from "@/lib/auth";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar user={user} />
        <main className="mx-auto w-full max-w-[1380px] px-4 pb-24 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
