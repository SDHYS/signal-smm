import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

// ⚠️ 1회용 상품 정리 라우트 — 실행 직후 삭제할 것. CRON_SECRET Bearer 보호.
// 비활성 + 도매 미연동(조달 불가) 상품을 삭제. 주문 이력 있으면 스킵(FK 보호).
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

// GET: 삭제 대상(비활성+미연동) 미리보기
export async function GET(req: Request) {
  const denied = guard(req);
  if (denied) return denied;
  const targets = await prisma.product.findMany({
    where: { isActive: false, providerServiceId: null },
    select: { id: true, name: true, category: true },
  });
  return NextResponse.json({ ok: true, targets });
}

// POST {confirm:"DELETE-UNSOURCEABLE"}: 실제 삭제
export async function POST(req: Request) {
  const denied = guard(req);
  if (denied) return denied;
  const body = (await req.json().catch(() => ({}))) as { confirm?: string };
  if (body.confirm !== "DELETE-UNSOURCEABLE")
    return NextResponse.json({ error: "confirm=DELETE-UNSOURCEABLE 필요" }, { status: 400 });

  const targets = await prisma.product.findMany({
    where: { isActive: false, providerServiceId: null },
    select: { id: true, name: true },
  });

  const deleted: string[] = [];
  const skipped: { name: string; reason: string }[] = [];
  for (const p of targets) {
    try {
      await prisma.product.delete({ where: { id: p.id } });
      deleted.push(p.name);
    } catch (e) {
      if ((e as { code?: string })?.code === "P2003")
        skipped.push({ name: p.name, reason: "주문 이력 있음(FK) — 비활성 유지" });
      else skipped.push({ name: p.name, reason: String(e) });
    }
  }
  return NextResponse.json({ ok: true, deleted, skipped });
}
