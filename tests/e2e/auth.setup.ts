import { test as setup, expect } from "@playwright/test";
import { ADMIN_STATE } from "./paths";

// 관리자 로그인을 1회만 수행하고 세션을 저장 → 모든 admin 테스트가 재사용.
// (반복 로그인으로 Rate Limit에 걸리는 것을 방지)
setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder("아이디를 입력하세요").fill("admin");
  await page.getByPlaceholder("비밀번호를 입력하세요").fill("Admin1234!");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page.getByRole("button", { name: "로그아웃" }).first()).toBeVisible({
    timeout: 15_000,
  });
  await page.context().storageState({ path: ADMIN_STATE });
});
