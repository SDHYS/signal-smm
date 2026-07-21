import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { fmtKSTStamp } from "@/lib/datetime";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING_PAYMENT", "PAID", "PROCESSING", "COMPLETED", "CANCELLED"] as const;
const STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "입금대기",
  PAID: "결제완료",
  PROCESSING: "진행중",
  COMPLETED: "완료",
  CANCELLED: "환불",
};

function csvCell(v: string | number | null | undefined): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

// 관리자 주문 CSV 다운로드 — 주문관리 화면과 동일한 필터(status/q) 적용, 전체 건수
export async function GET(req: Request) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN")
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "";
  const query = url.searchParams.get("q")?.trim() ?? "";

  const where: Prisma.OrderWhereInput = {
    ...(STATUSES.includes(status as never) ? { status: status as never } : {}),
    ...(query
      ? {
          OR: [
            { orderNo: { contains: query, mode: "insensitive" } },
            { user: { username: { contains: query, mode: "insensitive" } } },
            { user: { name: { contains: query, mode: "insensitive" } } },
            { items: { some: { productName: { contains: query, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const rows = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 10_000,
    include: {
      user: { select: { username: true, name: true } },
      items: {
        take: 1,
        select: {
          productName: true,
          quantity: true,
          unitPrice: true,
          targetUrl: true,
          providerOrderId: true,
          providerStatus: true,
        },
      },
    },
  });

  const header = [
    "주문번호", "주문일시", "상태", "아이디", "이름", "상품명", "수량",
    "단가(원)", "합계(원)", "주문링크", "도매주문번호", "도매상태", "관리자메모",
  ];
  const lines = [header.join(",")];
  for (const o of rows) {
    const it = o.items[0];
    lines.push(
      [
        csvCell(o.orderNo),
        csvCell(fmtKSTStamp(o.createdAt)),
        csvCell(STATUS_LABEL[o.status] ?? o.status),
        csvCell(o.user.username),
        csvCell(o.user.name),
        csvCell(it?.productName),
        csvCell(it?.quantity),
        csvCell(it?.unitPrice),
        csvCell(o.totalAmount),
        csvCell(it?.targetUrl),
        csvCell(it?.providerOrderId),
        csvCell(it?.providerStatus),
        csvCell(o.adminMemo),
      ].join(","),
    );
  }

  // BOM — 엑셀에서 한글 깨짐 방지
  const csv = "﻿" + lines.join("\r\n");
  const today = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${today}.csv"`,
    },
  });
}
