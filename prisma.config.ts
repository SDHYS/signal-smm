import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7: 마이그레이션/인트로스펙션용 datasource URL.
// process.env 로 읽어 변수가 없어도(예: Vercel 빌드의 prisma generate 단계) 에러 없이 통과시킨다.
// 실제 연결이 필요한 migrate 단계에서는 DATABASE_URL 이 주입된 상태여야 한다.
// (런타임 PrismaClient는 src/lib/prisma.ts 에서 pg 어댑터로 연결)
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // 마이그레이션은 풀링(pgbouncer) 연결에서 문제가 생길 수 있어 직접 연결(UNPOOLED)을 우선 사용.
    // 로컬엔 UNPOOLED 가 없으므로 일반 DATABASE_URL 로 폴백.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
});
