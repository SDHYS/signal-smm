import { test, expect } from "@playwright/test";

/**
 * 반응형 회귀 — 브레이크포인트별 가로 오버플로(가로 스크롤) 발생 여부 검사.
 * 페이지에 min-w 고정폭 요소가 남아 있으면 scrollWidth가 뷰포트를 초과한다.
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

const VIEWPORTS = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

for (const vp of VIEWPORTS) {
  for (const path of PAGES) {
    test(`${vp.name} ${path} — 가로 오버플로 없음`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(path, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth - doc.clientWidth;
      });
      expect(overflow, `${path} @${vp.width}px 가로 오버플로 ${overflow}px`).toBeLessThanOrEqual(1);
    });
  }
}
