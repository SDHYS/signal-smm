import { test, expect } from "@playwright/test";

/**
 * UI 인터랙션 QA — 클릭이 실제로 화면 상태를 바꾸는지 검증.
 * (매핑 점검의 자동화판: 플랫폼 필터, 상세 탭, 검색, 즐겨찾기 가드,
 *  FAQ 아코디언, 게시판 왕복, 모바일 드로어 이동)
 */
test.use({ viewport: { width: 1440, height: 900 } });

const row = (page: import("@playwright/test").Page, name: string) =>
  page.locator("span").filter({ hasText: new RegExp(`^${name}$`) });

// STEP01 플랫폼 타일 (이미지+라벨) — 라벨 텍스트로 버튼 선택
const tile = (page: import("@playwright/test").Page, name: string) =>
  page.getByRole("button").filter({ hasText: new RegExp(`^${name}$`) });

test("STEP01 플랫폼 선택 → STEP02 목록 필터링, 재클릭 시 해제", async ({ page }) => {
  await page.goto("/");
  await expect(row(page, "인스타그램 한국인 팔로워").first()).toBeVisible();

  await tile(page, "유튜브").click();
  await expect(row(page, "유튜브 조회수").first()).toBeVisible();
  await expect(row(page, "인스타그램 한국인 팔로워")).toHaveCount(0);

  // 재클릭 → 선택 해제 → 전체 서비스 복귀
  await tile(page, "유튜브").click();
  await expect(page.getByText("전체 서비스")).toBeVisible();
  await expect(row(page, "인스타그램 한국인 팔로워").first()).toBeVisible();
});

test("STEP03 상세 탭 — 탭마다 다른 내용 렌더", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "주문 방법" }).click();
  await expect(page.getByText(/플랫폼 선택 → 서비스 선택/)).toBeVisible();
  await page.getByRole("button", { name: "FAQ", exact: true }).click();
  await expect(page.getByText(/수량이 다 안 들어오면/)).toBeVisible();
  await page.getByRole("button", { name: "주의 사항" }).click();
  await expect(page.getByText(/수량이 다 안 들어오면/)).toHaveCount(0);
});

test("상단바 검색 → /?q= 필터 반영", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("서비스 검색 (예: 팔로워)").fill("팔로워");
  await page.getByPlaceholder("서비스 검색 (예: 팔로워)").press("Enter");
  await page.waitForURL("**/?q=**");
  await expect(row(page, "인스타그램 한국인 팔로워").first()).toBeVisible();
  await expect(row(page, "유튜브 조회수")).toHaveCount(0);
});

test("비로그인 즐겨찾기 → 로그인 안내 알럿", async ({ page }) => {
  let dialogMsg = "";
  page.on("dialog", (d) => {
    dialogMsg = d.message();
    return d.accept();
  });
  await page.goto("/");
  await page.getByLabel("즐겨찾기 추가").first().click();
  await expect.poll(() => dialogMsg).toContain("로그인");
});

test("서비스안내 — 플랫폼 탭 전환 + FAQ 아코디언", async ({ page }) => {
  await page.goto("/guide");
  await page.getByRole("button", { name: "유튜브", exact: true }).click();
  await expect(page.getByText("유튜브 구독자", { exact: false }).first()).toBeVisible();

  // FAQ 아코디언: Q1은 기본 열림(openFaq=0), Q2는 닫힘 → 클릭 시 열림
  const q2btn = page.getByRole("button", { name: /비공개 계정도 가능한가요/ });
  const faqItem = q2btn.locator("xpath=ancestor::div[contains(@class,'border')][1]");
  await expect(faqItem.getByText(/공개 계정으로 전환/)).toHaveCount(0); // 닫힘
  await q2btn.click();
  await expect(faqItem.getByText(/공개 계정으로 전환/)).toBeVisible(); // 열림
});

test("공지사항 목록 → 상세 → 목록 왕복", async ({ page }) => {
  await page.goto("/notice");
  const firstTitle = await page.locator("a[href^='/notice/']").first().textContent();
  await page.locator("a[href^='/notice/']").first().click();
  await page.waitForURL("**/notice/**");
  await expect(page.getByRole("link", { name: "목록으로" })).toBeVisible();
  await page.getByRole("link", { name: "목록으로" }).click();
  await page.waitForURL("**/notice");
  expect(firstTitle).toBeTruthy();
});

test("모바일 드로어 — 잔액충전 링크 이동", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "메뉴 열기" }).click();
  await page.getByRole("link", { name: "잔액충전" }).first().click();
  await page.waitForURL("**/charge");
  await expect(page.getByRole("heading", { name: "잔액충전" })).toBeVisible();
});

test("한글 줄바꿈 — 단어 중간에서 꺾이지 않음 (keep-all)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/support");
  const wordBreak = await page.evaluate(
    () => getComputedStyle(document.body).wordBreak,
  );
  expect(wordBreak).toBe("keep-all");
});
