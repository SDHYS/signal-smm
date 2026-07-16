import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { ADMIN_STATE } from "./paths";

/**
 * 풀 여정 QA — 실제 사용자/관리자 두 세션으로 돈 흐름 전체를 검증한다.
 *
 * 가입(4단계) → 로그아웃/재로그인 → 아이디찾기 → 충전신청 → 본인취소
 * → 재신청 → [관리자] 입금확인 → 잔액반영 확인 → 주문 → 주문내역/영수증
 * → 알림 확인 → 1:1 문의 → [관리자] 답변 → 답변 확인
 * → [관리자] 환불 → 잔액복구 확인 → 비밀번호 변경 → 새 비번 재로그인
 */
const uniq = Date.now().toString(36);
const USERNAME = `qae2e${uniq}`;
const EMAIL = `${USERNAME}@test.local`;
const PW1 = "Test1234!";
const PW2 = "Test5678!";
const DEPOSITOR = `QA입금자${uniq}`;
const INQ_TITLE = `QA 문의 ${uniq}`;

async function login(page: Page, username: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("아이디를 입력하세요").fill(username);
  await page.getByPlaceholder("비밀번호를 입력하세요").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page.getByRole("button", { name: "로그아웃" }).first()).toBeVisible({
    timeout: 15_000,
  });
}

async function logout(page: Page) {
  await page.getByRole("button", { name: "로그아웃" }).first().click();
  await expect(page.getByRole("link", { name: "로그인", exact: true }).first()).toBeVisible({
    timeout: 15_000,
  });
}

test.describe.configure({ mode: "serial" });
test.use({
  viewport: { width: 1440, height: 900 },
  // 로컬 dev에는 프록시가 없어 x-forwarded-for를 그대로 신뢰하므로,
  // 실행마다 고유 가짜 IP를 부여해 반복 실행이 Rate Limit에 걸리지 않게 한다.
  // (운영은 Vercel 프록시가 실제 IP로 덮어쓰므로 스푸핑 불가)
  extraHTTPHeaders: {
    "x-forwarded-for": `10.77.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  },
});

test("회원 풀 여정 — 가입부터 환불·비번변경까지", async ({ page, browser }) => {
  test.setTimeout(240_000);
  page.on("dialog", (d) => d.accept());

  // 관리자 세션은 setup에서 저장한 storageState 재사용 (admin 로그인 반복 방지)
  const adminCtx: BrowserContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: ADMIN_STATE,
    extraHTTPHeaders: {
      "x-forwarded-for": `10.78.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    },
  });
  const admin = await adminCtx.newPage();
  admin.on("dialog", (d) => d.accept());

  await test.step("① 회원가입 4단계", async () => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "전체동의" }).click();
    await page.getByRole("button", { name: "다음" }).click();
    await page.getByPlaceholder("가입 진행 아이디").fill(USERNAME);
    await page.getByPlaceholder("계정 분실 시 확인용 이메일").fill(EMAIL);
    await page.getByPlaceholder("8자 이상 입력").fill(PW1);
    await page.getByPlaceholder("비밀번호 재확인").fill(PW1);
    await page.getByRole("button", { name: "다음" }).click();
    await page.getByRole("button", { name: "구글" }).click();
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(page.getByText("가입이 완료되었어요")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "시작하기" }).click();
    await expect(page.getByText("STEP 01")).toBeVisible();
  });

  await test.step("② 로그아웃 → 재로그인", async () => {
    await logout(page);
    await login(page, USERNAME, PW1);
  });

  await test.step("③ 아이디 찾기 (마스킹 확인)", async () => {
    await page.goto("/find-id");
    await page.getByPlaceholder("이메일 입력").fill(EMAIL);
    await page.getByRole("button", { name: "아이디 찾기" }).click();
    // 결과 영역에는 원문 아이디가 아닌 마스킹(*)된 아이디만 노출되어야 한다
    // (사이드바 등 로그인 UI의 본인 아이디 표시는 검사 대상 아님)
    const result = page.getByText(/\*{2,}/);
    await expect(result).toBeVisible({ timeout: 10_000 });
    expect(await result.textContent()).not.toContain(USERNAME);
  });

  await test.step("④ 충전 신청(1만원) → 입금안내 노출", async () => {
    await page.goto("/charge");
    await page.getByRole("button", { name: "+ 1만원" }).click();
    await page.getByPlaceholder("입금자명을 작성해주세요").fill(DEPOSITOR);
    await page.getByRole("button", { name: "무통장입금 바로가기" }).click();
    await expect(page.getByText("충전 신청 완료 — 아래 계좌로 입금해주세요")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("입금대기").first()).toBeVisible();
  });

  await test.step("⑤ 본인 신청 취소", async () => {
    await page.getByRole("button", { name: "신청 취소" }).first().click();
    await expect(page.getByText("입금대기")).toHaveCount(0, { timeout: 15_000 });
  });

  await test.step("⑥ 재신청(5만원) → 관리자 입금확인 → 잔액 반영", async () => {
    await page.getByRole("button", { name: "+ 5만원" }).click();
    await page.getByPlaceholder("입금자명을 작성해주세요").fill(DEPOSITOR);
    await page.getByRole("button", { name: "무통장입금 바로가기" }).click();
    await expect(page.getByText("입금대기").first()).toBeVisible({ timeout: 15_000 });

    // 관리자 세션 (별도 컨텍스트, 이후 스텝에서 재사용)
    await login(admin, "admin", "Admin1234!");
    await admin.goto("/admin");
    const row = admin
      .getByText(`@${USERNAME}`)
      .locator("xpath=ancestor::div[contains(@class,'border-t')]");
    await row.getByRole("button", { name: "입금확인" }).click();
    await expect(row).toHaveCount(0, { timeout: 15_000 }); // 대기목록에서 사라짐

    // 사용자 잔액 50,000원 반영
    await page.goto("/charge");
    await expect(page.getByText("50,000원").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("충전완료").first()).toBeVisible();
  });

  let orderCost = 0;
  await test.step("⑦ 주문 생성 → 잔액 즉시 차감", async () => {
    await page.goto("/");
    const qtyInput = page.locator('input[placeholder^="최소 "]');
    const ph = (await qtyInput.getAttribute("placeholder")) ?? "";
    const minQty = Number(ph.match(/최소 (\d+)/)?.[1] ?? "1");
    await page.getByPlaceholder("게시물 링크를 입력해주세요").fill("https://instagram.com/p/qa-test");
    await qtyInput.fill(String(minQty));
    await page.getByRole("button", { name: "주문하기" }).click();
    await page.waitForURL("**/orders", { timeout: 20_000 });
    await expect(page.getByText("결제완료").first()).toBeVisible();

    // 차감액 = 50,000 - 현재 잔액
    await page.goto("/charge");
    const box = await page.getByText("충전후 잔액").locator("xpath=following-sibling::div").textContent();
    const remain = Number((box ?? "").replace(/[^\d]/g, ""));
    orderCost = 50_000 - remain;
    expect(orderCost).toBeGreaterThan(0); // 실제로 차감됐는지
  });

  await test.step("⑧ 영수증/거래명세서 열람", async () => {
    await page.goto("/orders");
    await page.getByRole("link", { name: "영수증" }).first().click();
    await page.waitForURL("**/orders/receipt/**", { timeout: 15_000 });
    await expect(page.getByText("합계").first()).toBeVisible();

    await page.goto("/orders");
    await page.getByRole("link", { name: "거래명세서" }).first().click();
    await page.waitForURL("**/orders/receipt/**type=statement**", { timeout: 15_000 });
    await expect(page.getByText("거래명세서").first()).toBeVisible();
  });

  await test.step("⑨ 알림 — 드롭다운→전체보기 페이지→모두 읽음", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: "내 알림" }).click();
    await expect(page.getByText(/충전 완료/).first()).toBeVisible({ timeout: 10_000 });
    // 전체 보기 → 알림 페이지
    await page.getByRole("link", { name: "전체 보기" }).click();
    await page.waitForURL("**/notifications");
    await expect(page.getByRole("heading", { name: "알림" })).toBeVisible();
    await expect(page.getByText(/충전 완료/).first()).toBeVisible();
    await page.getByRole("button", { name: /모두 읽음/ }).click();
    await expect(page.getByRole("button", { name: /모두 읽음/ })).toHaveCount(0, { timeout: 10_000 });
  });

  await test.step("⑩ 1:1 문의 작성 → 관리자 답변 → 사용자 확인", async () => {
    await page.goto("/inquiry/write");
    await page.getByPlaceholder("제목을 입력해주세요").fill(INQ_TITLE);
    await page.getByPlaceholder("문의 내용을 입력해주세요").fill("QA 자동화 문의 본문입니다.");
    await page.getByRole("button", { name: "문의 등록" }).click();
    await page.waitForURL("**/inquiry", { timeout: 15_000 });
    await expect(page.getByText(INQ_TITLE)).toBeVisible();

    await admin.goto("/admin/inquiries");
    const item = admin
      .getByText(INQ_TITLE)
      .locator("xpath=ancestor::div[contains(@class,'p-6')]");
    await item.getByPlaceholder("답변 입력").fill("QA 답변입니다. 확인 부탁드립니다.");
    await item.getByRole("button", { name: "답변 등록" }).click();
    await expect(item.getByText("답변완료")).toBeVisible({ timeout: 15_000 });

    await page.goto("/inquiry");
    await page.getByText(INQ_TITLE).click();
    await expect(page.getByText("관리자 답변")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("QA 답변입니다. 확인 부탁드립니다.")).toBeVisible();
  });

  await test.step("⑪ 관리자 환불 → 잔액 복구 확인", async () => {
    await admin.goto("/admin/orders");
    const row = admin
      .getByText(`@${USERNAME}`)
      .first()
      .locator("xpath=ancestor::div[contains(@class,'border')][1]");
    await row.getByRole("button", { name: "환불" }).click();
    await expect(admin.getByText("환불", { exact: true }).first()).toBeVisible({ timeout: 15_000 });

    // 잔액 50,000원 원복
    await page.goto("/charge");
    await expect(page.getByText("50,000원").first()).toBeVisible({ timeout: 15_000 });
    // 환불내역 탭에 표시
    await page.goto("/orders");
    await page.getByRole("button", { name: "환불내역" }).click();
    await expect(page.getByText("취소").first()).toBeVisible();
  });

  await test.step("⑫ 비밀번호 변경 → 새 비번으로 재로그인", async () => {
    await page.goto("/mypage");
    const pwInputs = page.locator('input[type="password"]');
    await pwInputs.nth(0).fill(PW1);
    await pwInputs.nth(1).fill(PW2);
    await pwInputs.nth(2).fill(PW2);
    await page.getByRole("button", { name: "비밀번호 변경" }).click();
    await page.waitForTimeout(1500);

    await logout(page);
    // 이전 비밀번호는 거부되어야 한다
    await page.goto("/login");
    await page.getByPlaceholder("아이디를 입력하세요").fill(USERNAME);
    await page.getByPlaceholder("비밀번호를 입력하세요").fill(PW1);
    await page.getByRole("button", { name: "로그인" }).click();
    await expect(page.getByText("아이디 또는 비밀번호가 올바르지 않습니다.")).toBeVisible();
    // 새 비밀번호로 성공
    await login(page, USERNAME, PW2);
  });

  await adminCtx.close();
});
