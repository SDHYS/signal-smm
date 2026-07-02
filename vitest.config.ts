import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // 서버 전용 가드/Next 런타임 모듈은 테스트에서 스텁으로 대체
      "server-only": path.resolve(__dirname, "tests/stubs/empty.ts"),
      "next/cache": path.resolve(__dirname, "tests/stubs/next-cache.ts"),
      "next/headers": path.resolve(__dirname, "tests/stubs/next-headers.ts"),
    },
  },
  test: {
    include: ["tests/integration/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // 실DB를 공유하므로 파일 단위 직렬 실행 (테스트 내부의 동시성은 Promise.all로 수행)
    fileParallelism: false,
    testTimeout: 30_000,
    environment: "node",
  },
});
