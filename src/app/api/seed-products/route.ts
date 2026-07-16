import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 1회용: 도매 매핑리포트의 기회 플랫폼(페이스북/텔레그램/X) 상품 6종 시드.
// 전부 비활성(isActive: false) — 관리자가 가격 확인 후 활성화. 동명 상품 있으면 skip.
// 실행 후 이 라우트는 제거한다. CRON_SECRET Bearer 보호.

const PRODUCTS = [
  {
    category: "페이스북",
    name: "페이스북 페이지 팔로워",
    description: "페이스북 페이지의 팔로워를 늘려 신뢰도와 도달률을 높입니다.",
    unitPrice: 70,
    minQty: 20,
    maxQty: 50000,
  },
  {
    category: "페이스북",
    name: "페이스북 게시물 좋아요",
    description: "게시물 좋아요를 늘려 뉴스피드 노출과 참여를 끌어올립니다.",
    unitPrice: 25,
    minQty: 20,
    maxQty: 50000,
  },
  {
    category: "텔레그램",
    name: "텔레그램 채널 멤버",
    description: "텔레그램 채널 구독 멤버를 늘려 채널 신뢰도를 높입니다.",
    unitPrice: 50,
    minQty: 50,
    maxQty: 50000,
  },
  {
    category: "텔레그램",
    name: "텔레그램 게시물 조회수",
    description: "채널 게시물의 조회수를 빠르게 부스팅합니다.",
    unitPrice: 5,
    minQty: 100,
    maxQty: 1000000,
  },
  {
    category: "X트위터",
    name: "X(트위터) 팔로워",
    description: "X(구 트위터) 계정 팔로워를 늘려 계정 영향력을 키웁니다.",
    unitPrice: 90,
    minQty: 20,
    maxQty: 50000,
  },
  {
    category: "X트위터",
    name: "X(트위터) 좋아요",
    description: "포스트 좋아요를 늘려 알고리즘 노출을 강화합니다.",
    unitPrice: 30,
    minQty: 20,
    maxQty: 50000,
  },
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
  for (const p of PRODUCTS) {
    const exists = await prisma.product.findFirst({ where: { name: p.name } });
    if (exists) {
      result[p.name] = "이미 존재 — skip";
      continue;
    }
    await prisma.product.create({
      data: { ...p, isActive: false, sortOrder: sortOrder++ },
    });
    result[p.name] = "등록 (비활성)";
  }
  return NextResponse.json({ ok: true, ...result });
}
