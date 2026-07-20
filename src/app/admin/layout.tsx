import Link from "next/link";
import { redirect } from "next/navigation";
import { Store } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";
import AdminLogout from "@/components/admin/AdminLogout";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  return (
    <div className="min-h-screen bg-soft-2">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-[1024px] items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* 타이틀 배지 — 클릭 시 관리자 메인으로 */}
          <Link href="/admin" className="flex items-center gap-3 transition hover:opacity-80">
            <span className="rounded bg-navy px-2.5 py-1 text-xs font-semibold text-white sm:px-3 sm:text-sm">
              SIGNAL SMM ADMIN
            </span>
          </Link>
          {/* 우측: 위 = 쇼핑몰(관리자명 왼쪽 선에 맞춤), 아래 = 관리자님 + 로그아웃 */}
          <div className="flex flex-col items-start gap-1.5 text-sm">
            <Link
              href="/"
              aria-label="쇼핑몰 사이트로"
              title="쇼핑몰 사이트로"
              className="text-navy transition hover:opacity-70"
            >
              <Store size={20} strokeWidth={2} />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-gray">{user.name} 님</span>
              <AdminLogout />
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1024px] px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <AdminNav />
      </div>
      <main className="mx-auto max-w-[1024px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
    </div>
  );
}
