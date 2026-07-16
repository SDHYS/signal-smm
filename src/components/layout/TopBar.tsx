"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutGrid,
  Newspaper,
  Bell,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import type { CurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/auth";
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

// 모바일 드로어 내비 (LNB 대체)
const drawerMember = [
  { label: "메인페이지", href: "/" },
  { label: "마이페이지", href: "/mypage" },
  { label: "블로그", href: "/blog" },
  { label: "잔액충전", href: "/charge" },
  { label: "주문내역", href: "/orders" },
];
const drawerService = [
  { label: "서비스 안내", href: "/guide" },
  { label: "1:1 문의", href: "/inquiry" },
  { label: "고객센터", href: "/support" },
  { label: "공지사항", href: "/notice" },
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
  siteName,
  notifications,
  unreadCount,
  logoUrl,
}: {
  user: CurrentUser | null;
  siteName: string;
  notifications: TopBarNotification[];
  unreadCount: number;
  logoUrl: string;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = keyword.trim();
    setDrawerOpen(false);
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

  async function handleLogout() {
    setDrawerOpen(false);
    await logoutAction();
    router.refresh();
    router.push("/");
  }

  return (
    <header className="w-full px-4 py-4 sm:px-8 sm:py-6">
      <div className="mx-auto flex w-full max-w-[1380px] items-center justify-between gap-3">
        {/* 좌측: 햄버거(<lg) + 검색(sm+) */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            aria-label="메뉴 열기"
            onClick={() => setDrawerOpen(true)}
            className="shrink-0 text-ink transition-opacity hover:opacity-60 lg:hidden"
          >
            <Menu size={26} strokeWidth={1.5} />
          </button>

          {/* 모바일 로고 */}
          <Link href="/" className="shrink-0 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={siteName} className="h-6 w-auto" />
          </Link>

          <form
            onSubmit={submitSearch}
            className="hidden w-full max-w-[360px] items-center gap-1.5 rounded-full bg-soft px-6 py-3.5 sm:flex"
          >
            <button type="submit" aria-label="검색" className="shrink-0 text-muted transition hover:text-navy">
              <Search size={22} strokeWidth={1.5} />
            </button>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              aria-label="서비스 검색어"
              placeholder="서비스 검색 (예: 팔로워)"
              className="w-full bg-transparent text-sm text-navy placeholder:text-gray focus:outline-none"
            />
          </form>
        </div>

        {/* 우측 아이콘 + 프로필 */}
        <div className="flex shrink-0 items-center gap-4 sm:gap-7">
          <div className="flex items-center gap-3.5 text-ink">
            {/* 전체 메뉴 드롭다운 (sm+) */}
            <div className="relative hidden sm:block">
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

            {/* 회사 소개 (sm+) */}
            <Link
              href="/about"
              aria-label="회사 소개"
              className="hidden transition-opacity hover:opacity-60 sm:block"
            >
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
                    <div className="absolute -right-16 top-9 z-50 w-[calc(100vw-32px)] max-w-[340px] rounded-xl border border-line bg-white shadow-[0_8px_30px_rgba(0,0,0,0.10)] sm:right-0">
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
                      <Link
                        href="/notifications"
                        onClick={() => setBellOpen(false)}
                        className="block border-t border-line px-4 py-3 text-center text-sm font-medium text-navy transition hover:bg-soft/60"
                      >
                        전체 보기
                      </Link>
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
              <span className="h-8 w-8 rounded-full bg-[#D9D9D9] sm:h-[38px] sm:w-[38px]" />
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

      {/* ── 모바일/태블릿 드로어 (LNB 대체) ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-[300px] max-w-[85vw] flex-col gap-8 overflow-y-auto bg-white px-6 py-6">
            <div className="flex items-center justify-between">
              <Link href="/" onClick={() => setDrawerOpen(false)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt={siteName} className="h-7 w-auto" />
              </Link>
              <button aria-label="닫기" onClick={() => setDrawerOpen(false)}>
                <X size={24} strokeWidth={1.5} className="text-navy" />
              </button>
            </div>

            {/* 잔액 + 충전 (핵심 CTA 상단 배치) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded border border-line px-3 py-4">
                <span className="text-sm font-normal text-gray">보유잔액</span>
                <span className="text-lg font-medium text-navy">
                  ₩{(user?.balance ?? 0).toLocaleString()}
                </span>
              </div>
              <Link
                href="/charge"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center rounded bg-gradient-to-r from-[#2E82FF] via-[#8DBBFF] to-[#2E82FF] px-3 py-4 text-lg font-semibold text-white shadow-[6px_6px_16px_rgba(46,130,255,0.48)]"
              >
                충전하기
              </Link>
            </div>

            {/* 검색 (모바일 전용) */}
            <form
              onSubmit={submitSearch}
              className="flex items-center gap-1.5 rounded-full bg-soft px-5 py-3 sm:hidden"
            >
              <button type="submit" aria-label="검색" className="shrink-0 text-muted">
                <Search size={20} strokeWidth={1.5} />
              </button>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                aria-label="서비스 검색어"
                placeholder="서비스 검색"
                className="w-full bg-transparent text-sm text-navy placeholder:text-gray focus:outline-none"
              />
            </form>

            {/* 회원 메뉴 */}
            <nav className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <p className="px-1 text-sm text-gray">회원 메뉴</p>
                <div className="flex flex-col">
                  {!user && (
                    <>
                      <DrawerLink href="/login" label="로그인" close={() => setDrawerOpen(false)} />
                      <DrawerLink href="/signup" label="회원가입" close={() => setDrawerOpen(false)} />
                    </>
                  )}
                  {drawerMember.map((m) => (
                    <DrawerLink key={m.href} href={m.href} label={m.label} close={() => setDrawerOpen(false)} />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <p className="px-1 text-sm text-gray">서비스 안내</p>
                <div className="flex flex-col">
                  {drawerService.map((m) => (
                    <DrawerLink key={m.href} href={m.href} label={m.label} close={() => setDrawerOpen(false)} />
                  ))}
                </div>
              </div>
              {user && (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded px-3 py-3.5 text-left text-base font-medium text-navy transition hover:bg-soft"
                >
                  <LogOut size={22} strokeWidth={1.5} />
                  로그아웃
                </button>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

function DrawerLink({
  href,
  label,
  close,
}: {
  href: string;
  label: string;
  close: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={close}
      className="rounded px-3 py-3.5 text-base font-medium text-navy transition hover:bg-soft"
    >
      {label}
    </Link>
  );
}
