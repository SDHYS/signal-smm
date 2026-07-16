import "dotenv/config";

process.env.AUTH_SECRET ??= "test-secret-key-for-vitest-only";
// getSettingsMap은 process.env.VITEST(러너가 자동 설정)를 감지해 캐시를 우회한다.
