import { test, expect } from "@playwright/test";
import { ADMIN_STATE } from "./paths";

/**
 * 관리자 기능 E2E — 대시보드 통계, 주문 관리(필터·검색·메모), 회원 상세, 접근 가드.
 * 관리자 세션은 auth.setup.ts에서 1회 생성한 storageState를 재사용한다.
 */
test.use({ viewport: { width: 1440, height: 900 } });

// 로그아웃 상태에서의 접근 가드 (storageState 미사용)
test("비관리자 접근 가드 — /admin/orders는 로그인으로 리다이렉트", async ({ browser }) => {
  const ctx = await browser.newContext(); // 세션 없음
  const page = await ctx.newPage();
  await page.goto("/admin/orders");
  await page.waitForURL("**/login", { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
  await ctx.close();
});

test.describe("관리자(로그인 세션)", () => {
  test.use({ storageState: ADMIN_STATE });

  test("대시보드 — 통계 카드 5종 노출 + 주문관리 링크 이동", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
    for (const label of ["오늘 주문", "오늘 매출", "입금 대기", "진행중 주문", "미답변 문의"]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await page.getByText("오늘 주문", { exact: true }).click();
    await page.waitForURL((u) => u.pathname === "/admin/orders");
    await expect(page.getByRole("heading", { name: "주문 관리" })).toBeVisible();
  });

  test("주문 관리 — 상태 필터 탭이 status 쿼리를 반영", async ({ page }) => {
    await page.goto("/admin/orders");
    await expect(page.getByRole("heading", { name: "주문 관리" })).toBeVisible();
    for (const t of ["전체", "입금대기", "결제완료", "진행중", "완료", "환불"]) {
      await expect(page.getByRole("link", { name: new RegExp(`^${t}`) })).toBeVisible();
    }
    await page.getByRole("link", { name: /^진행중/ }).click();
    await page.waitForURL((u) => u.search.includes("status=PROCESSING"));
  });

  test("주문 관리 — 검색어 입력 후 초기화 링크 동작", async ({ page }) => {
    await page.goto("/admin/orders");
    await page.getByPlaceholder(/주문번호/).fill("nonexistent-xyz");
    await page.getByRole("button", { name: "검색" }).click();
    await page.waitForURL((u) => u.search.includes("q=nonexistent-xyz"));
    await expect(page.getByText("조건에 맞는 주문이 없습니다.")).toBeVisible();
    await page.getByRole("link", { name: "초기화" }).click();
    await page.waitForURL((u) => !u.search.includes("q="));
  });

  test("회원 상세 — 목록에서 진입, 요약·내역·관리 패널 노출", async ({ page }) => {
    await page.goto("/admin/members");
    await page.getByRole("link", { name: "상세" }).first().click();
    await page.waitForURL((u) => /^\/admin\/members\/.+/.test(u.pathname));

    for (const label of ["보유 잔액", "누적 충전", "누적 결제", "주문 · 문의"]) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: /주문 내역/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "기본 정보" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "회원 관리" })).toBeVisible();
    await expect(page.getByRole("button", { name: "증액" })).toBeVisible();
    await expect(page.getByRole("button", { name: "쪽지 전송" })).toBeVisible();

    await page.getByRole("link", { name: "← 회원 목록" }).click();
    await page.waitForURL((u) => u.pathname === "/admin/members");
  });

  test("회원 상세 — 존재하지 않는 회원은 404 페이지", async ({ page }) => {
    await page.goto("/admin/members/no-such-member-id");
    await expect(page.getByText("This page could not be found.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "기본 정보" })).toHaveCount(0);
  });
});
