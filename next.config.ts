import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Docker 단일 노드 배포용 standalone 빌드
  output: "standalone",
  // pg / @prisma/client 는 서버 외부 패키지로 번들에서 제외
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;
