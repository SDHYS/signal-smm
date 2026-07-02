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
  webServer: {
    command: "npx next dev -p 3093",
    url: "http://localhost:3093",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
