import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 1회용: 네이버/네이버블로그 상품 3종 추가(활성) + 기존 기회 플랫폼 6종 활성화.
// 실행 후 이 라우트는 제거한다. CRON_SECRET Bearer 보호.

const NEW_PRODUCTS = [
  {
    category: "네이버",
    name: "네이버 검색 유입 트래픽",
    description: "네이버 검색을 통한 실제 방문자 유입으로 사이트 트래픽을 늘립니다.",
    unitPrice: 5,
    minQty: 500,
    maxQty: 1000000,
  },
  {
    category: "네이버",
    name: "네이버 키워드 검색 유입",
    description: "지정한 키워드의 네이버 검색 유입을 만들어 검색 반응을 높입니다.",
    unitPrice: 7,
    minQty: 1000,
    maxQty: 1000000,
  },
  {
    category: "네이버블로그",
    name: "네이버 블로그 유입 트래픽",
    description: "네이버 블로그발 방문자 유입으로 블로그·사이트 도달을 확대합니다.",
    unitPrice: 5,
    minQty: 500,
    maxQty: 1000000,
  },
];

const ACTIVATE = [
  "페이스북 페이지 팔로워",
  "페이스북 게시물 좋아요",
  "텔레그램 채널 멤버",
  "텔레그램 게시물 조회수",
  "X(트위터) 팔로워",
  "X(트위터) 좋아요",
];

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const last = await prisma.product.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  let sortOrder = (last?.sortOrder ?? 0) + 1;

  const result: Record<string, string> = {};
  for (const p of NEW_PRODUCTS) {
    const exists = await prisma.product.findFirst({ where: { name: p.name } });
    if (exists) {
      result[p.name] = "이미 존재 — skip";
      continue;
    }
    await prisma.product.create({ data: { ...p, isActive: true, sortOrder: sortOrder++ } });
    result[p.name] = "등록 (활성)";
  }

  const act = await prisma.product.updateMany({
    where: { name: { in: ACTIVATE }, isActive: false },
    data: { isActive: true },
  });
  result["기존 6종 활성화"] = `${act.count}건`;

  return NextResponse.json({ ok: true, ...result });
}
