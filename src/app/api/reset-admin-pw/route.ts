import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// 1회용: signaldecode 관리자 비밀번호를 임시값으로 초기화 후 이 라우트는 제거한다.
// 원문 비밀번호는 코드에 없음(bcrypt 해시만 포함). CRON_SECRET Bearer 보호.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const r = await prisma.user.updateMany({
    where: { username: "signaldecode", role: "ADMIN" },
    data: { passwordHash: "$2b$10$.SRE9iT.xuIb4HfqKbsbi.pMxHGAVH/4prVrzlurLZcfa1EpVf3aC" },
  });
  return NextResponse.json({ ok: true, updated: r.count });
}
