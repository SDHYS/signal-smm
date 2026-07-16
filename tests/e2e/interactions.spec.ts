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

test("문의전용 플랫폼(카카오) — 주문 UI 차단 + 1:1 문의 유도", async ({ page }) => {
  await page.goto("/");
  await tile(page, "카카오").click();
  // 안내 카드 노출
  await expect(page.getByText(/카카오 서비스는 별도 문의로 진행됩니다/)).toBeVisible();
  await expect(page.getByRole("link", { name: "1:1 문의하기" })).toHaveAttribute("href", "/inquiry/write");
  // 주문 UI 전부 차단 (STEP04~06 + 주문하기 버튼)
  await expect(page.getByRole("button", { name: "주문하기" })).toHaveCount(0);
  await expect(page.getByPlaceholder("게시물 링크를 입력해주세요")).toHaveCount(0);
  await expect(page.getByText("STEP 06")).toHaveCount(0);

  // 상품 있는 플랫폼(페이스북) 선택 → 정상 주문 모드 복귀
  await tile(page, "페이스북").click();
  await expect(row(page, "페이스북 페이지 팔로워").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "주문하기" })).toBeVisible();
});

test("신규 플랫폼(네이버·텔레그램·X) — 상품 노출 확인", async ({ page }) => {
  await page.goto("/");
  await tile(page, "네이버").click();
  await expect(row(page, "네이버 검색 유입 트래픽").first()).toBeVisible();
  await tile(page, "텔레그램").click();
  await expect(row(page, "텔레그램 게시물 조회수").first()).toBeVisible();
  await tile(page, "X트위터").click();
  await expect(row(page, "X\\(트위터\\) 팔로워").first()).toBeVisible();
});

test("비밀번호 찾기 링크 → find-id 비밀번호 안내 섹션", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "비밀번호 찾기" }).click();
  await page.waitForURL("**/find-id#password");
  await expect(page.getByText("비밀번호를 잊으셨나요?")).toBeVisible();
  await expect(page.getByRole("heading", { name: "아이디·비밀번호 찾기" })).toBeVisible();
});

test("가입 2단계 — 비밀번호 불일치 인라인 경고", async ({ page }) => {
  await page.goto("/signup");
  await page.getByRole("button", { name: "전체동의" }).click();
  await page.getByRole("button", { name: "다음" }).click();
  await page.getByPlaceholder("8자 이상 입력").fill("password123");
  await page.getByPlaceholder("비밀번호 재확인").fill("password999");
  await expect(page.getByText("비밀번호가 일치하지 않습니다.")).toBeVisible();
});
