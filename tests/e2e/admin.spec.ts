import { test, expect, type Page } from "@playwright/test";

/**
 * 관리자 기능 E2E — 대시보드 통계, 주문 관리(필터·검색·메모),
 * 관리자 접근 가드.
 */
test.use({
  viewport: { width: 1440, height: 900 },
  extraHTTPHeaders: {
    "x-forwarded-for": `10.60.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  },
});

async function loginAdmin(page: Page) {
  await page.goto("/login");
  await page.getByPlaceholder("아이디를 입력하세요").fill("admin");
  await page.getByPlaceholder("비밀번호를 입력하세요").fill("Admin1234!");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page.getByRole("button", { name: "로그아웃" }).first()).toBeVisible({
    timeout: 15_000,
  });
}

test("비관리자 접근 가드 — /admin/orders는 로그인으로 리다이렉트", async ({ page }) => {
  await page.goto("/admin/orders");
  await page.waitForURL("**/login", { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
});

test("대시보드 — 통계 카드 5종 노출 + 주문관리 링크 이동", async ({ page }) => {
  await loginAdmin(page);
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
  await loginAdmin(page);
  await page.goto("/admin/orders");
  await expect(page.getByRole("heading", { name: "주문 관리" })).toBeVisible();

  // 필터 탭 6종 노출
  for (const t of ["전체", "입금대기", "결제완료", "진행중", "완료", "환불"]) {
    await expect(page.getByRole("link", { name: new RegExp(`^${t}`) })).toBeVisible();
  }
  // 진행중 탭 클릭 → URL 반영
  await page.getByRole("link", { name: /^진행중/ }).click();
  await page.waitForURL((u) => u.search.includes("status=PROCESSING"));
});

test("주문 관리 — 검색어 입력 후 초기화 링크 동작", async ({ page }) => {
  await loginAdmin(page);
  await page.goto("/admin/orders");
  await page.getByPlaceholder(/주문번호/).fill("nonexistent-xyz");
  await page.getByRole("button", { name: "검색" }).click();
  await page.waitForURL((u) => u.search.includes("q=nonexistent-xyz"));
  await expect(page.getByText("조건에 맞는 주문이 없습니다.")).toBeVisible();
  await page.getByRole("link", { name: "초기화" }).click();
  await page.waitForURL((u) => !u.search.includes("q="));
});
