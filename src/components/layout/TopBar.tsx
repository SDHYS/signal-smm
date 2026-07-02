"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, LayoutGrid, Newspaper, Bell } from "lucide-react";
import type { CurrentUser } from "@/lib/auth";

const quickMenu = [
  { label: "주문하기", href: "/" },
  { label: "잔액충전", href: "/charge" },
  { label: "주문내역", href: "/orders" },
  { label: "서비스 안내", href: "/guide" },
  { label: "1:1 문의", href: "/inquiry" },
  { label: "공지사항", href: "/notice" },
];

export default function TopBar({ user }: { user: CurrentUser | null }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = keyword.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}#step02` : "/");
  }

  return (
    <header className="w-full px-4 py-6 sm:px-8">
      <div className="mx-auto flex w-full max-w-[1380px] items-center justify-between gap-4">
        {/* 검색 → 메인 서비스 목록 필터 */}
        <form
          onSubmit={submitSearch}
          className="flex w-full max-w-[360px] items-center gap-1.5 rounded-full bg-soft px-6 py-3.5"
        >
          <button type="submit" aria-label="검색" className="shrink-0 text-muted transition hover:text-navy">
            <Search size={22} strokeWidth={1.5} />
          </button>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="서비스 검색 (예: 팔로워)"
            className="w-full bg-transparent text-sm text-navy placeholder:text-gray focus:outline-none"
          />
        </form>

        {/* 우측 아이콘 + 프로필 */}
        <div className="flex items-center gap-7">
          <div className="flex items-center gap-3.5 text-ink">
            {/* 전체 메뉴 드롭다운 */}
            <div className="relative">
              <button
                aria-label="전체 메뉴"
                onClick={() => setMenuOpen((v) => !v)}
                className="transition-opacity hover:opacity-60"
              >
                <LayoutGrid size={26} strokeWidth={1.5} />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-9 z-50 w-44 rounded-xl border border-line bg-white py-2 shadow-[0_8px_30px_rgba(0,0,0,0.10)]">
                    {quickMenu.map((m) => (
                      <Link
                        key={m.href}
                        href={m.href}
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm font-medium text-navy transition hover:bg-soft"
                      >
                        {m.label}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            <Link href="/blog" aria-label="블로그 소식" className="transition-opacity hover:opacity-60">
              <Newspaper size={26} strokeWidth={1.5} />
            </Link>
            <Link href="/notice" aria-label="공지 알림" className="relative transition-opacity hover:opacity-60">
              <Bell size={26} strokeWidth={1.5} />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-[#ED1C24]" />
            </Link>
          </div>

          {user ? (
            <Link href="/orders" className="flex items-center gap-1.5 transition-opacity hover:opacity-80">
              <span className="h-[38px] w-[38px] rounded-full bg-[#D9D9D9]" />
              <span className="hidden text-base font-medium text-navy sm:inline">
                {user.name}
              </span>
            </Link>
          ) : (
            <Link href="/login" className="text-base font-medium text-navy hover:underline">
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
