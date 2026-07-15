import { NextResponse } from "next/server";
import { syncProviderOrders } from "@/lib/sync-orders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Vercel Cron(매일 1회 — Hobby 플랜 한도) 또는 외부 크론이 호출.
// 더 짧은 주기가 필요하면 외부 크론(cron-job.org 등)에서
// Authorization: Bearer $CRON_SECRET 으로 이 경로를 호출하면 된다.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret) {
    if (auth !== `Bearer ${secret}`)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "CRON_SECRET 미설정 — 운영에서는 필수입니다." },
      { status: 503 },
    );
  }

  try {
    const result = await syncProviderOrders();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("sync-orders cron failed", e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
