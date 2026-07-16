import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 1회용: 운영 관리자 아이디 admin → signaldecode 변경 후 이 라우트는 제거한다.
// CRON_SECRET Bearer로 보호.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const taken = await prisma.user.findUnique({
    where: { username: "signaldecode" },
    select: { id: true },
  });
  if (taken)
    return NextResponse.json({ ok: false, error: "signaldecode 이미 사용 중" });

  const r = await prisma.user.updateMany({
    where: { username: "admin", role: "ADMIN" },
    data: { username: "signaldecode" },
  });

  const check = await prisma.user.findUnique({
    where: { username: "signaldecode" },
    select: { username: true, role: true },
  });
  return NextResponse.json({ ok: true, updated: r.count, check });
}
