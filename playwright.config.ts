import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3093",
    screenshot: "only-on-failure",
  },
  projects: [
    // 관리자 세션을 1회 생성 (admin 테스트들이 재사용)
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      testIgnore: /auth\.setup\.ts/,
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npx next dev -p 3093",
    url: "http://localhost:3093",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
