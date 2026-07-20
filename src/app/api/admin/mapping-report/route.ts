import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getServices, usdKrw } from "@/lib/smm";

// ⚠️ 1회용 매핑 리포트 라우트 — 실행 직후 삭제할 것. CRON_SECRET Bearer 보호, 읽기 전용.
export const dynamic = "force-dynamic";

function guard(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET 미설정" }, { status: 503 });
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(req.headers.get("authorization") ?? "");
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return null;
}

const TYPE_KW: [RegExp, string[]][] = [
  [/팔로워/, ["follower"]],
  [/좋아요/, ["like"]],
  [/조회수/, ["view"]],
  [/구독자/, ["subscriber"]],
  [/멤버|회원|구독/, ["member", "subscriber"]],
  [/댓글/, ["comment"]],
];
const PLATFORM_KW: Record<string, string[]> = {
  인스타그램: ["instagram"],
  유튜브: ["youtube"],
  틱톡: ["tiktok"],
  페이스북: ["facebook"],
  텔레그램: ["telegram"],
  X트위터: ["twitter"],
  네이버: ["naver"],
  네이버블로그: ["naver"],
};

export async function GET(req: Request) {
  const denied = guard(req);
  if (denied) return denied;

  const rate = usdKrw();
  const [products, services] = await Promise.all([
    prisma.product.findMany({ orderBy: { sortOrder: "asc" } }),
    getServices(true).catch(() => []),
  ]);

  const rows = products.map((p) => {
    const pkw = PLATFORM_KW[p.category] ?? [p.category.toLowerCase()];
    const tkw = TYPE_KW.find(([re]) => re.test(p.name))?.[1] ?? [];
    const korean = /한국인|한국/.test(p.name);
    const cands = services
      .filter((s) => {
        const h = `${s.name} ${s.category}`.toLowerCase();
        const n = String(s.name).toLowerCase();
        return (
          pkw.some((k) => h.includes(k)) &&
          (tkw.length === 0 || tkw.some((k) => n.includes(k))) &&
          (!korean || n.includes("korea")) &&
          Number(s.rate) > 0
        );
      })
      .sort((a, b) => Number(a.rate) - Number(b.rate))
      .slice(0, 3)
      .map((s) => ({
        id: s.service,
        name: String(s.name).slice(0, 46),
        costKrw: Math.round((Number(s.rate) * rate) / 10) / 100,
        margin: Number(((p.unitPrice * 1000) / (Number(s.rate) * rate)).toFixed(1)),
        min: Number(s.min),
        max: Number(s.max),
      }));
    return {
      category: p.category,
      name: p.name,
      unitPrice: p.unitPrice,
      minQty: p.minQty,
      maxQty: p.maxQty,
      active: p.isActive,
      mappedTo: p.providerServiceId,
      candidates: cands,
      noWholesale: cands.length === 0,
    };
  });

  return NextResponse.json({
    ok: true,
    usdKrw: rate,
    productCount: products.length,
    serviceCount: services.length,
    mapped: rows.filter((r) => r.mappedTo != null).length,
    unmapped: rows.filter((r) => r.mappedTo == null).length,
    rows,
  });
}
