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
    url: process.env.DATABASE_URL,
  },
});
