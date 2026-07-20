import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// ⚠️ 1회용 관리자 재설정 라우트 — 실행 직후 삭제할 것.
// CRON_SECRET Bearer 토큰으로 보호. 비밀번호는 요청 본문으로만 받아 서버에서 해시(코드/깃에 평문 없음).
export const dynamic = "force-dynamic";

function tokenMatches(auth: string | null, secret: string): boolean {
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(auth ?? "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function guard(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET 미설정" }, { status: 503 });
  if (!tokenMatches(req.headers.get("authorization"), secret))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return null;
}

// 현재 관리자 목록 조회 (읽기 전용)
export async function GET(req: Request) {
  const denied = guard(req);
  if (denied) return denied;
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, username: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ ok: true, adminCount: admins.length, admins });
}

// 관리자 계정 재설정: username + 새 비밀번호 지정.
// 우선순위: (1) 해당 username 유저 존재 → 그 계정 pw/role 갱신
//           (2) 기존 ADMIN 존재 → 가장 오래된 ADMIN의 username→지정값 + pw 갱신
//           (3) 없음 → 신규 관리자 생성(email 필요)
export async function POST(req: Request) {
  const denied = guard(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
    email?: string;
  };
  const username = body.username?.trim();
  const password = body.password;
  if (!username || !password || password.length < 6)
    return NextResponse.json({ error: "username·password(6자+) 필요" }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const existingByName = await prisma.user.findUnique({ where: { username } });
    if (existingByName) {
      await prisma.user.update({
        where: { id: existingByName.id },
        data: { passwordHash, role: "ADMIN" },
      });
      return NextResponse.json({ ok: true, action: "updated-by-username", user: { id: existingByName.id, username } });
    }

    const firstAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      orderBy: { createdAt: "asc" },
    });
    if (firstAdmin) {
      await prisma.user.update({
        where: { id: firstAdmin.id },
        data: { username, passwordHash, role: "ADMIN" },
      });
      return NextResponse.json({
        ok: true,
        action: "renamed-existing-admin",
        user: { id: firstAdmin.id, oldUsername: firstAdmin.username, newUsername: username, email: firstAdmin.email },
      });
    }

    const email = body.email?.trim() || `${username}@signalsmm.com`;
    const created = await prisma.user.create({
      data: { username, email, name: "관리자", passwordHash, role: "ADMIN" },
      select: { id: true, username: true, email: true },
    });
    return NextResponse.json({ ok: true, action: "created", user: created });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
