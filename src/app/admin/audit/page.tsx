import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { fmtKST } from "@/lib/datetime";

const PAGE_SIZE = 50;

// 필터 그룹: 라벨 → 해당 action 목록
const GROUPS: { key: string; label: string; actions?: string[] }[] = [
  { key: "ALL", label: "전체" },
  { key: "refund", label: "주문 환불", actions: ["order.refund"] },
  { key: "auto", label: "자동 환불", actions: ["sync.refund"] },
  { key: "charge", label: "충전 확인", actions: ["charge.confirm", "charge.confirm.partial", "charge.cancel"] },
  { key: "balance", label: "잔액 조정", actions: ["balance.adjust"] },
  { key: "etc", label: "기타", actions: ["order.status", "password.reset"] },
];

const ACTION_LABEL: Record<string, { text: string; cls: string }> = {
  "charge.confirm": { text: "충전 확인", cls: "bg-blue/10 text-blue" },
  "charge.confirm.partial": { text: "부분입금 확인", cls: "bg-blue/10 text-blue" },
  "charge.cancel": { text: "충전 취소", cls: "bg-soft text-gray" },
  "order.refund": { text: "주문 환불", cls: "bg-orange/10 text-orange" },
  "order.status": { text: "주문 상태변경", cls: "bg-soft text-gray" },
  "balance.adjust": { text: "잔액 조정", cls: "bg-navy/10 text-navy" },
  "password.reset": { text: "비번 초기화", cls: "bg-soft text-gray" },
  "sync.refund": { text: "자동 환불(동기화)", cls: "bg-orange/10 text-orange" },
};

const won = (n: number) => `${n.toLocaleString()}원`;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; page?: string }>;
}) {
  const { group, page } = await searchParams;
  const activeGroup = GROUPS.find((g) => g.key === group)?.key ?? "ALL";
  const pageNum = Math.max(1, Number(page) || 1);

  const actions = GROUPS.find((g) => g.key === activeGroup)?.actions;
  const where: Prisma.AdminAuditLogWhereInput = actions ? { action: { in: actions } } : {};

  const [rows, total] = await Promise.all([
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (pageNum - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.adminAuditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function tabHref(key: string) {
    return key === "ALL" ? "/admin/audit" : `/admin/audit?group=${key}`;
  }
  function pageHref(n: number) {
    const p = new URLSearchParams();
    if (activeGroup !== "ALL") p.set("group", activeGroup);
    p.set("page", String(n));
    return `/admin/audit?${p.toString()}`;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-navy">감사 로그</h1>
        <p className="text-base text-gray">
          환불·충전확인·잔액조정 등 민감 조치의 실행자·사유·금액 기록 (자동 환불 포함)
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {GROUPS.map((g) => {
          const active = g.key === activeGroup;
          return (
            <Link
              key={g.key}
              href={tabHref(g.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active ? "bg-navy text-white" : "bg-white text-gray-2 hover:bg-soft"
              }`}
            >
              {g.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-xl border border-line bg-white p-8 text-base text-gray">
          기록된 감사 로그가 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <div className="min-w-[820px]">
            <div className="flex items-center bg-soft px-6 py-4 text-sm font-medium text-gray">
              <div className="w-[150px]">시각</div>
              <div className="w-[130px]">실행자</div>
              <div className="w-[130px]">조치</div>
              <div className="w-[130px]">대상</div>
              <div className="w-[110px] text-right">금액</div>
              <div className="flex-1">사유 / 상세</div>
            </div>
            {rows.map((r) => {
              const meta = ACTION_LABEL[r.action] ?? { text: r.action, cls: "bg-soft text-gray" };
              return (
                <div key={r.id} className="flex items-start border-t border-line px-6 py-3.5 text-sm">
                  <div className="w-[150px] text-gray">{fmtKST(r.createdAt)}</div>
                  <div className="w-[130px] font-medium text-navy">{r.adminName}</div>
                  <div className="w-[130px]">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${meta.cls}`}>
                      {meta.text}
                    </span>
                  </div>
                  <div className="w-[130px] text-navy">{r.targetLabel ?? r.targetType}</div>
                  <div className="w-[110px] text-right font-medium text-navy">
                    {r.amount != null ? won(r.amount) : "—"}
                  </div>
                  <div className="flex-1 whitespace-pre-wrap break-words text-gray">
                    {r.reason ?? (r.meta ? formatMeta(r.meta) : "—")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {pageNum > 1 && (
            <Link href={pageHref(pageNum - 1)} className="rounded border border-line px-3 py-2 text-sm text-navy hover:bg-soft">
              이전
            </Link>
          )}
          <span className="text-sm text-gray">
            {pageNum} / {totalPages} · 총 {total}건
          </span>
          {pageNum < totalPages && (
            <Link href={pageHref(pageNum + 1)} className="rounded border border-line px-3 py-2 text-sm text-navy hover:bg-soft">
              다음
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function formatMeta(json: string): string {
  try {
    return Object.entries(JSON.parse(json) as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" · ");
  } catch {
    return "—";
  }
}
