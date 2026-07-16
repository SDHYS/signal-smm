import { test, expect } from "@playwright/test";
import { ADMIN_STATE } from "./paths";

/**
 * 어드민 CRUD 작동 점검 — 각 관리 기능이 실제로 쓰고/공개 페이지에 반영되고/지워지는지.
 * (대시보드·주문관리·회원상세·설정은 admin.spec, 입금확인·문의답변·환불은 full-journey가 커버)
 */
test.use({ viewport: { width: 1440, height: 900 }, storageState: ADMIN_STATE });

const uniq = Date.now().toString(36);

test("공지사항 — 등록 → 공개 페이지 노출 → 상세 → 삭제", async ({ page }) => {
  const title = `QA공지 ${uniq}`;
  page.on("dialog", (d) => d.accept());

  await page.goto("/admin/notices");
  await page.getByPlaceholder("제목").fill(title);
  await page.getByPlaceholder("내용").fill("QA 공지 본문입니다.");
  await page.getByRole("button", { name: "공지 등록" }).click();
  await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });

  // 공개 페이지 반영 + 상세 진입
  await page.goto("/notice");
  await page.getByText(title).click();
  await page.waitForURL("**/notice/**");
  await expect(page.getByText("QA 공지 본문입니다.")).toBeVisible();

  // 삭제 → 공개 목록에서 사라짐
  await page.goto("/admin/notices");
  const row = page
    .getByText(title)
    .locator("xpath=ancestor::div[contains(@class,'border')][1]");
  await row.getByRole("button", { name: "삭제" }).click();
  await expect(page.getByText(title)).toHaveCount(0, { timeout: 15_000 });
  await page.goto("/notice");
  await expect(page.getByText(title)).toHaveCount(0);
});

test("블로그 — 등록(태그 포함) → 공개 노출 → 삭제", async ({ page }) => {
  const title = `QA블로그 ${uniq}`;
  page.on("dialog", (d) => d.accept());

  await page.goto("/admin/blog");
  await page.getByPlaceholder("제목").fill(title);
  await page.getByPlaceholder("내용").fill("QA 블로그 본문입니다.");
  await page.getByPlaceholder(/태그/).fill("QA태그, 테스트");
  await page.getByRole("button", { name: "글 등록" }).click();
  await expect(page.getByText(title)).toBeVisible({ timeout: 15_000 });

  await page.goto("/blog");
  await expect(page.getByText(title)).toBeVisible();
  await page.getByText(title).click();
  await page.waitForURL("**/blog/**");
  await expect(page.getByText("QA 블로그 본문입니다.")).toBeVisible();

  await page.goto("/admin/blog");
  const row = page
    .getByText(title)
    .locator("xpath=ancestor::div[contains(@class,'border')][1]");
  await row.getByRole("button", { name: "삭제" }).click();
  await expect(page.getByText(title)).toHaveCount(0, { timeout: 15_000 });
});

test("상품 — 등록 → 메인 STEP02 노출 → 비활성화 → 메인 미노출 → 삭제", async ({ page }) => {
  const name = `QA상품 ${uniq}`;
  page.on("dialog", (d) => d.accept());

  await page.goto("/admin/products");
  await page.getByRole("button", { name: "유튜브", exact: true }).click();
  await page.getByPlaceholder(/상품명/).fill(name);
  await page.getByPlaceholder("단가(원)").fill("77");
  await page.getByRole("button", { name: "상품 등록" }).click();
  await expect(page.getByText(`[유튜브] ${name}`)).toBeVisible({ timeout: 15_000 });

  // 메인 노출 (검색으로 확인)
  await page.goto(`/?q=${encodeURIComponent(name)}`);
  await expect(page.locator("span").filter({ hasText: new RegExp(`^${name}$`) }).first()).toBeVisible();

  // 비활성화 → 메인 미노출
  await page.goto("/admin/products");
  const row = page
    .getByText(`[유튜브] ${name}`)
    .locator("xpath=ancestor::div[contains(@class,'border-b')][1]");
  await row.getByRole("button", { name: "비활성화" }).click();
  await expect(row.getByText("비활성", { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.goto(`/?q=${encodeURIComponent(name)}`);
  await expect(page.locator("span").filter({ hasText: new RegExp(`^${name}$`) })).toHaveCount(0);

  // 삭제 (주문 이력 없음 → 가능)
  await page.goto("/admin/products");
  await page
    .getByText(`[유튜브] ${name}`)
    .locator("xpath=ancestor::div[contains(@class,'border-b')][1]")
    .getByRole("button", { name: "삭제" })
    .click();
  await expect(page.getByText(`[유튜브] ${name}`)).toHaveCount(0, { timeout: 15_000 });
});

test("대시보드 쪽지 — 회원에게 발송 성공 메시지", async ({ page }) => {
  await page.goto("/admin");
  // AdminMessage 폼: 받는 아이디 + 내용
  await page.getByPlaceholder(/아이디/).first().fill("no_such_user_qa");
  await page.getByPlaceholder(/내용|쪽지/).first().fill("QA 쪽지");
  await page.getByRole("button", { name: /전송|보내기/ }).click();
  await expect(page.getByText(/해당 아이디의 회원이 없습니다/)).toBeVisible({ timeout: 15_000 });
});

test("상품 가격 편집 — 도매가 표시 + 판매가 수정이 메인에 반영", async ({ page }) => {
  const name = `QA가격 ${uniq}`;
  page.on("dialog", (d) => d.accept());

  // 상품 등록
  await page.goto("/admin/products");
  await page.getByRole("button", { name: "유튜브", exact: true }).click();
  await page.getByPlaceholder(/상품명/).fill(name);
  await page.getByPlaceholder("단가(원)").fill("100");
  await page.getByRole("button", { name: "상품 등록" }).click();
  await expect(page.getByText(`[유튜브] ${name}`)).toBeVisible({ timeout: 15_000 });

  // 미연동 → 도매가 미연동 표기 + 가격 수정
  const rowEl = page
    .getByText(`[유튜브] ${name}`)
    .locator("xpath=ancestor::div[contains(@class,'border-b')][1]");
  await expect(rowEl.getByText(/도매가 — \(미연동\)/)).toBeVisible();
  await rowEl.getByLabel(`${name} 판매가`).fill("777");
  await rowEl.getByRole("button", { name: "가격 저장" }).click();
  await expect(rowEl.getByText("저장됨")).toBeVisible({ timeout: 15_000 });

  // 메인 반영 확인
  await page.goto(`/?q=${encodeURIComponent(name)}`);
  await expect(page.getByText("777원").first()).toBeVisible();

  // 정리
  await page.goto("/admin/products");
  await page
    .getByText(`[유튜브] ${name}`)
    .locator("xpath=ancestor::div[contains(@class,'border-b')][1]")
    .getByRole("button", { name: "삭제" })
    .click();
  await expect(page.getByText(`[유튜브] ${name}`)).toHaveCount(0, { timeout: 15_000 });
});
