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


  test("설정 — 고객센터/회사소개 입력이 공개 페이지에 반영", async ({ page }) => {
    // 저장
    await page.goto("/admin/settings");
    await page.getByLabel("카카오톡 채널").fill("@qa테스트채널");
    await page.getByLabel("고객센터 전화번호").fill("010-9999-8888");
    await page.getByLabel("소개 본문").fill("QA 소개문구입니다.\n두 번째 줄입니다.");
    await page.getByRole("button", { name: "전체 저장" }).click();
    await expect(page.getByText("저장되었습니다.")).toBeVisible({ timeout: 15_000 });

    // 고객센터 반영
    await page.goto("/support");
    await expect(page.getByText("@qa테스트채널")).toBeVisible();
    const tel = page.locator('a[href="tel:01099998888"]');
    await expect(tel).toBeVisible();
    await expect(tel).toHaveText("010-9999-8888");

    // 회사소개 반영 (줄바꿈 유지)
    await page.goto("/about");
    await expect(page.getByText(/QA 소개문구입니다/)).toBeVisible();
    await expect(page.getByText(/두 번째 줄입니다/)).toBeVisible();

    // 원복 — 비우면 기본 동작(1:1 문의 유도 / 기본 소개문구)으로 복귀
    await page.goto("/admin/settings");
    await page.getByLabel("카카오톡 채널").fill("");
    await page.getByLabel("고객센터 전화번호").fill("");
    await page.getByLabel("소개 본문").fill("");
    await page.getByRole("button", { name: "전체 저장" }).click();
    await expect(page.getByText("저장되었습니다.")).toBeVisible({ timeout: 15_000 });
    await page.goto("/support");
    await expect(page.getByRole("link", { name: "1:1 문의 바로가기" }).first()).toBeVisible();
  });

  test("문구 관리 — 수정이 유저 페이지에 반영, 비우면 기본값 복귀", async ({ page }) => {
    // 히어로 윗줄 문구 변경
    await page.goto("/admin/texts");
    await page.getByLabel("히어로 윗줄").fill("QA 커스텀 히어로 문구입니다");
    await page.getByRole("button", { name: "전체 저장" }).click();
    await expect(page.getByText("저장되었습니다", { exact: false })).toBeVisible({ timeout: 15_000 });

    await page.goto("/");
    await expect(page.getByText("QA 커스텀 히어로 문구입니다")).toBeVisible();

    // 원복 (빈 값 → 기본 문구)
    await page.goto("/admin/texts");
    await page.getByLabel("히어로 윗줄").fill("");
    await page.getByRole("button", { name: "전체 저장" }).click();
    await expect(page.getByText("저장되었습니다", { exact: false })).toBeVisible({ timeout: 15_000 });
    await page.goto("/");
    await expect(page.getByText("인스타그램 좋아요 늘리기로 비즈니스를 성장하세요!")).toBeVisible();
  });

  test("사업자 정보 — 저장 시 푸터에 표기, 비우면 숨김", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.getByLabel("상호").fill("주식회사 QA테스트");
    await page.getByLabel("사업자등록번호").fill("123-45-67890");
    await page.getByRole("button", { name: "전체 저장" }).click();
    await expect(page.getByText("저장되었습니다.")).toBeVisible({ timeout: 15_000 });

    await page.goto("/");
    await expect(page.getByText(/상호 주식회사 QA테스트/)).toBeVisible();
    await expect(page.getByText(/사업자등록번호 123-45-67890/)).toBeVisible();
    // 푸터 약관 링크 동작
    await page.getByRole("link", { name: "이용약관" }).click();
    await page.waitForURL("**/terms");
    await expect(page.getByRole("heading", { name: "이용약관" })).toBeVisible();

    // 원복
    await page.goto("/admin/settings");
    await page.getByLabel("상호").fill("");
    await page.getByLabel("사업자등록번호").fill("");
    await page.getByRole("button", { name: "전체 저장" }).click();
    await expect(page.getByText("저장되었습니다.")).toBeVisible({ timeout: 15_000 });
    await page.goto("/");
    await expect(page.getByText(/상호 주식회사 QA테스트/)).toHaveCount(0);
  });

  test("약관 본문 — 어드민 입력이 /terms에 반영, 가입 1단계 보기 링크", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.getByLabel("이용약관 전문").fill("제1조 (목적) QA 약관 본문입니다.");
    await page.getByRole("button", { name: "전체 저장" }).click();
    await expect(page.getByText("저장되었습니다.")).toBeVisible({ timeout: 15_000 });

    await page.goto("/terms");
    await expect(page.getByText("제1조 (목적) QA 약관 본문입니다.")).toBeVisible();

    // 가입 1단계 '보기' 링크 존재
    await page.goto("/signup");
    await expect(page.getByRole("link", { name: "보기" }).first()).toHaveAttribute("href", "/terms");

    // 원복
    await page.goto("/admin/settings");
    await page.getByLabel("이용약관 전문").fill("");
    await page.getByRole("button", { name: "전체 저장" }).click();
    await expect(page.getByText("저장되었습니다.")).toBeVisible({ timeout: 15_000 });
    await page.goto("/terms");
    await expect(page.getByText("이용약관을 준비 중입니다.")).toBeVisible();
  });

  test("커스터마이징 — 테마 색상이 사이트 CSS 변수에 반영", async ({ page }) => {
    await page.goto("/admin/settings");
    await page.getByLabel("포인트 색상 (버튼·강조)", { exact: true }).fill("#10b981");
    await page.getByRole("button", { name: "전체 저장" }).click();
    await expect(page.getByText("저장되었습니다.")).toBeVisible({ timeout: 15_000 });

    await page.goto("/");
    const orange = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--color-orange").trim(),
    );
    expect(orange).toBe("#10b981");

    // 원복 → 기본 테마
    await page.goto("/admin/settings");
    await page.getByLabel("포인트 색상 (버튼·강조)", { exact: true }).fill("");
    await page.getByRole("button", { name: "전체 저장" }).click();
    await expect(page.getByText("저장되었습니다.")).toBeVisible({ timeout: 15_000 });
    await page.goto("/");
    const restored = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--color-orange").trim(),
    );
    expect(restored).toBe("#ef552b");
  });
});
