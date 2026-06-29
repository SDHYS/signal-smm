import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 헬스체크: DB 연결 여부까지 확인한다.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up" });
  } catch (error) {
    console.error("health check failed", error);
    return NextResponse.json(
      { status: "error", db: "down" },
      { status: 503 },
    );
  }
}
