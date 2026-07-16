import { test, expect } from "@playwright/test";

/**
 * 페이지 품질 검사 — 공개 페이지 전체에서
 *  1) JS 런타임 에러(pageerror) 2) console.error 3) 4xx/5xx 리소스 4) 깨진 이미지
 * 가 없는지 스캔한다.
 */
const PAGES = [
  "/",
  "/guide",
  "/notice",
  "/inquiry",
  "/charge",
  "/orders",
  "/support",
  "/blog",
  "/login",
  "/signup",
  "/find-id",
  "/about",
  "/terms",
  "/privacy",
];

// dev 환경 소음 제외 (HMR, 소스맵, 파비콘)
const IGNORE = [/webpack/, /hot-update/, /__nextjs/, /favicon/, /source-map/];

for (const path of PAGES) {
  test(`${path} — 콘솔에러/실패요청/깨진이미지 없음`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error" && !IGNORE.some((re) => re.test(msg.text())))
        consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => pageErrors.push(String(err)));
    page.on("response", (res) => {
      if (res.status() >= 400 && !IGNORE.some((re) => re.test(res.url())))
        failedRequests.push(`${res.status()} ${res.url()}`);
    });

    await page.goto(path, { waitUntil: "networkidle" });

    const brokenImages = await page.$$eval("img", (imgs) =>
      imgs
        .filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute("src"))
        .map((i) => i.getAttribute("src")!),
    );

    expect(pageErrors, `JS 에러: ${pageErrors.join(" | ")}`).toEqual([]);
    expect(consoleErrors, `콘솔 에러: ${consoleErrors.join(" | ")}`).toEqual([]);
    expect(failedRequests, `실패 요청: ${failedRequests.join(" | ")}`).toEqual([]);
    expect(brokenImages, `깨진 이미지: ${brokenImages.join(" | ")}`).toEqual([]);
  });
}
