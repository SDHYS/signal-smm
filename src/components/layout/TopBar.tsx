"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, LayoutGrid, Newspaper, Bell } from "lucide-react";
import type { CurrentUser } from "@/lib/auth";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/app/actions/notification";

export type TopBarNotification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

const quickMenu = [
  { label: "주문하기", href: "/" },
  { label: "잔액충전", href: "/charge" },
  { label: "주문내역", href: "/orders" },
  { label: "마이페이지", href: "/mypage" },
  { label: "서비스 안내", href: "/guide" },
  { label: "1:1 문의", href: "/inquiry" },
  { label: "회사 소개", href: "/about" },
];

function timeAgo(iso: string) {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function TopBar({
  user,
  notifications,
  unreadCount,
}: {
  user: CurrentUser | null;
  notifications: TopBarNotification[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = keyword.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}#step02` : "/");
  }

  async function openNotification(n: TopBarNotification) {
    setBellOpen(false);
    if (!n.read) await markNotificationRead(n.id);
    if (n.link) router.push(n.link);
    router.refresh();
  }

  async function readAll() {
    await markAllNotificationsRead();
    router.refresh();
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
                onClick={() => {
                  setMenuOpen((v) => !v);
                  setBellOpen(false);
                }}
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

            {/* 회사 소개 */}
            <Link href="/about" aria-label="회사 소개" className="transition-opacity hover:opacity-60">
              <Newspaper size={26} strokeWidth={1.5} />
            </Link>

            {/* 내 알림 */}
            {user ? (
              <div className="relative">
                <button
                  aria-label="내 알림"
                  onClick={() => {
                    setBellOpen((v) => !v);
                    setMenuOpen(false);
                  }}
                  className="relative transition-opacity hover:opacity-60"
                >
                  <Bell size={26} strokeWidth={1.5} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ED1C24] px-1 text-[10px] font-semibold leading-none text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {bellOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} />
                    <div className="absolute right-0 top-9 z-50 w-[340px] rounded-xl border border-line bg-white shadow-[0_8px_30px_rgba(0,0,0,0.10)]">
                      <div className="flex items-center justify-between border-b border-line px-4 py-3">
                        <span className="text-sm font-semibold text-navy">알림</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={readAll}
                            className="text-xs font-medium text-gray transition hover:text-navy"
                          >
                            모두 읽음
                          </button>
                        )}
                      </div>
                      <div className="max-h-[360px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="px-4 py-8 text-center text-sm text-gray">
                            알림이 없습니다.
                          </p>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => openNotification(n)}
                              className={`flex w-full flex-col gap-1 border-b border-line/60 px-4 py-3 text-left transition last:border-0 hover:bg-soft/60 ${
                                n.read ? "opacity-60" : ""
                              }`}
                            >
                              <span className="flex items-start gap-1.5 text-sm font-medium text-navy">
                                {!n.read && (
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue" />
                                )}
                                {n.title}
                              </span>
                              {n.body && (
                                <span className="line-clamp-2 text-xs text-gray">{n.body}</span>
                              )}
                              <span className="text-xs text-muted">{timeAgo(n.createdAt)}</span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/login" aria-label="내 알림" className="transition-opacity hover:opacity-60">
                <Bell size={26} strokeWidth={1.5} />
              </Link>
            )}
          </div>

          {user ? (
            <Link href="/mypage" className="flex items-center gap-1.5 transition-opacity hover:opacity-80">
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
