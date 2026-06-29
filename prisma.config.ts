import "dotenv/config";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

// Prisma 7: 마이그레이션/인트로스펙션용 datasource URL은 여기서 주입한다.
// (런타임 PrismaClient는 src/lib/prisma.ts 에서 pg 어댑터로 연결)
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
