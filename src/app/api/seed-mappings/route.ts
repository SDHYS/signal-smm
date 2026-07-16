import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServices } from "@/lib/smm";

export const dynamic = "force-dynamic";

// 1회용: 실계정 도매 서비스 매핑 12종 + 공급 없는 2종 비활성.
// 서비스 실존 검증 후 rate/meta 스냅샷 저장 (setProviderService와 동일 방식).
// 실행 후 이 라우트는 제거한다. CRON_SECRET Bearer 보호.

const MAPPINGS: {
  name: string;
  serviceId: number;
  minQty?: number; // 도매 범위에 맞춘 수량 조정 (지정 시)
  maxQty?: number;
}[] = [
  { name: "인스타그램 한국인 팔로워", serviceId: 3601 }, // 10~100,000 완전 일치
  { name: "인스타그램 게시물 좋아요", serviceId: 4181 },
  { name: "유튜브 조회수", serviceId: 4111 },
  { name: "유튜브 구독자", serviceId: 4190, minQty: 50, maxQty: 10000 },
  { name: "틱톡 팔로워", serviceId: 4270 },
  { name: "페이스북 페이지 팔로워", serviceId: 4205 },
  { name: "페이스북 게시물 좋아요", serviceId: 4203 },
  { name: "텔레그램 게시물 조회수", serviceId: 4243 },
  { name: "X(트위터) 팔로워", serviceId: 4236, maxQty: 20000 },
  { name: "네이버 검색 유입 트래픽", serviceId: 3843 },
  { name: "네이버 키워드 검색 유입", serviceId: 1746 },
  { name: "네이버 블로그 유입 트래픽", serviceId: 3844 },
];

// 도매에 대응 서비스가 없어 자동 조달 불가 → 판매 중단 (관리자가 언제든 재활성 가능)
const DEACTIVATE = ["텔레그램 채널 멤버", "X(트위터) 좋아요"];

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const services = await getServices(true); // 실계정 목록 강제 갱신
  const result: Record<string, string> = {};

  for (const m of MAPPINGS) {
    const product = await prisma.product.findFirst({ where: { name: m.name } });
    if (!product) {
      result[m.name] = "상품 없음 — skip";
      continue;
    }
    const svc = services.find((s) => s.service === m.serviceId);
    if (!svc) {
      result[m.name] = `도매 #${m.serviceId} 없음 — skip`;
      continue;
    }
    await prisma.product.update({
      where: { id: product.id },
      data: {
        providerServiceId: m.serviceId,
        providerRate: Number(svc.rate) || 0,
        providerMeta: JSON.stringify({
          name: svc.name,
          category: svc.category,
          min: Number(svc.min),
          max: Number(svc.max),
          type: svc.type,
          refill: svc.refill,
          cancel: svc.cancel,
          mappedAt: new Date().toISOString(),
        }),
        ...(m.minQty !== undefined ? { minQty: m.minQty } : {}),
        ...(m.maxQty !== undefined ? { maxQty: m.maxQty } : {}),
      },
    });
    result[m.name] = `#${m.serviceId} 매핑${m.minQty || m.maxQty ? " (수량 조정)" : ""}`;
  }

  const de = await prisma.product.updateMany({
    where: { name: { in: DEACTIVATE }, isActive: true },
    data: { isActive: false },
  });
  result["공급 없음 비활성"] = `${de.count}건`;

  return NextResponse.json({ ok: true, ...result });
}
