import { test, expect } from "@playwright/test";

test.describe("스모크 — 핵심 흐름", () => {
  test("메인 페이지: 히어로 + 주문 STEP 렌더", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("STEP 01")).toBeVisible();
    await expect(page.getByText("STEP 06")).toBeVisible();
  });

  test("로그인 실패: 동일 메시지로 계정 존재 비노출", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("아이디를 입력하세요").fill("no_such_user_e2e");
    await page.getByPlaceholder("비밀번호를 입력하세요").fill("wrongpass123");
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(
      page.getByText("아이디 또는 비밀번호가 올바르지 않습니다."),
    ).toBeVisible();
  });

  test("로그인 성공: 관리자 시드 계정 → 로그인 상태 UI", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/login");
    await page.getByPlaceholder("아이디를 입력하세요").fill("admin");
    await page.getByPlaceholder("비밀번호를 입력하세요").fill("Admin1234!");
    await page.getByRole("button", { name: "로그인" }).click();
    // 로그인되면 사이드바에 로그아웃 버튼 노출
    await expect(page.getByRole("button", { name: "로그아웃" }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("모바일(390px): 햄버거 → 드로어 열림", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "메뉴 열기" }).click();
    await expect(page.getByRole("link", { name: "회원가입" }).first()).toBeVisible();
  });
});
