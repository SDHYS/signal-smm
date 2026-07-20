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
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-8">
          {/* 타이틀 배지 — 클릭 시 관리자 메인으로 */}
          <Link href="/admin" className="flex items-center gap-3 transition hover:opacity-80">
            <span className="rounded bg-navy px-3 py-1 text-sm font-semibold text-white">
              SIGNAL SMM ADMIN
            </span>
          </Link>
          {/* 우측: 위 = 쇼핑몰, 아래 = 관리자님 + 로그아웃 */}
          <div className="flex flex-col items-end gap-1.5 text-sm">
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
      <div className="mx-auto max-w-[1100px] px-8 pt-8">
        <AdminNav />
      </div>
      <main className="mx-auto max-w-[1100px] px-8 py-8">{children}</main>
    </div>
  );
}
