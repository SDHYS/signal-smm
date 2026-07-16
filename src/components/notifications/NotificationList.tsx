"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions/notification";

export type NotiItem = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

function timeAgo(iso: string) {
  const d = new Date(iso);
  const mins = Math.max(1, Math.floor((Date.now() - d.getTime()) / 60000));
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return d.toLocaleDateString("ko-KR");
}

export default function NotificationList({
  items,
  unreadCount,
}: {
  items: NotiItem[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function openOne(n: NotiItem) {
    if (!n.read) await markNotificationRead(n.id);
    if (n.link) router.push(n.link);
    else router.refresh();
  }

  async function readAll() {
    setBusy(true);
    await markAllNotificationsRead();
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2.5">
          <p className="text-base font-normal text-[#767676]">주문·충전·문의 알림</p>
          <h1 className="text-[26px] font-bold leading-9 sm:text-[34px] sm:leading-[46px] lg:text-[40px] lg:leading-[52px] text-black">
            알림
          </h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={readAll}
            disabled={busy}
            className="shrink-0 rounded-lg border border-line px-4 py-2.5 text-sm font-medium text-navy transition hover:bg-soft disabled:opacity-50"
          >
            모두 읽음 ({unreadCount})
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl bg-soft p-8 text-base text-gray">알림이 없습니다.</p>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-white">
          {items.map((n) => {
            const inner = (
              <div
                className={`flex flex-col gap-1 border-b border-line px-5 py-4 text-left transition last:border-0 hover:bg-soft/50 ${
                  n.read ? "opacity-60" : ""
                }`}
              >
                <span className="flex items-start gap-2 text-base font-medium text-navy">
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue" />
                  )}
                  {n.title}
                </span>
                {n.body && <span className="text-sm leading-6 text-gray">{n.body}</span>}
                <span className="text-xs text-muted">{timeAgo(n.createdAt)}</span>
              </div>
            );
            return (
              <button key={n.id} onClick={() => openOne(n)} className="w-full">
                {inner}
              </button>
            );
          })}
        </div>
      )}

      <Link href="/" className="self-start text-sm text-gray underline hover:text-navy">
        홈으로
      </Link>
    </div>
  );
}
