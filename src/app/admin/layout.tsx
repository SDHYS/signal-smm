import Link from "next/link";
import { redirect } from "next/navigation";
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
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-8 py-5">
          <div className="flex items-center gap-3">
            <span className="rounded bg-navy px-3 py-1 text-sm font-semibold text-white">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray">{user.name} 님</span>
            <Link
              href="/"
              className="rounded-lg border border-line px-4 py-2 font-medium text-navy transition hover:bg-soft"
            >
              사이트로
            </Link>
            <AdminLogout />
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
