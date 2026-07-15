/**
 * 도매(공급사) 매핑 리포트 생성기
 *
 * 우리 DB 상품과 도매 서비스 목록을 비교해
 *  1) 우리 상품별 도매 후보 (원가/마진/수량범위 포함)
 *  2) 우리 쪽에 상품이 없는 플랫폼 vs 도매 공급 가능 여부
 *  3) 도매에 아예 공급이 없는 플랫폼 (조달 불가 리스트)
 * 를 docs/도매매핑리포트.md 로 출력한다.
 *
 * 실행: npx tsx scripts/provider-report.ts  (SMM_API_KEY 필요)
 */
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const USD_KRW = Number(process.env.SMM_USD_KRW) || 1450;

type Svc = {
  service: number;
  name: string;
  category: string;
  rate: string;
  min: number | string;
  max: number | string;
  refill: boolean;
  cancel: boolean;
};

// 메인 STEP01 플랫폼 타일 ↔ 도매 검색 키워드
const PLATFORM_KEYWORDS: Record<string, string[]> = {
  인스타그램: ["instagram", "인스타"],
  유튜브: ["youtube", "유튜브"],
  틱톡: ["tiktok", "틱톡"],
  페이스북: ["facebook", "페이스북"],
  텔레그램: ["telegram", "텔레그램"],
  카카오: ["kakao", "카카오"],
  쓰레드: ["threads", "쓰레드"],
  X트위터: ["twitter", " x ", "트위터"],
  네이버: ["naver", "네이버"],
  네이버플레이스: ["naver place", "플레이스"],
  네이버블로그: ["naver blog", "블로그"],
  무신사: ["musinsa", "무신사"],
  쿠팡: ["coupang", "쿠팡"],
  오늘의집: ["오늘의집", "ohou"],
  올리브영: ["olive", "올리브영"],
  마켓컬리: ["kurly", "컬리"],
  배달의민족: ["배달의민족", "배민", "baemin"],
};

// 상품명 → 서비스 유형 키워드
const TYPE_KEYWORDS: [RegExp, string[]][] = [
  [/팔로워/, ["follower", "팔로워"]],
  [/좋아요/, ["like", "좋아요"]],
  [/조회수/, ["view", "조회수"]],
  [/구독자/, ["subscriber", "구독자"]],
  [/댓글/, ["comment", "댓글"]],
];

function hay(s: Svc) {
  return `${s.name} ${s.category}`.toLowerCase();
}

async function main() {
  const key = process.env.SMM_API_KEY;
  if (!key) throw new Error("SMM_API_KEY가 .env에 없습니다.");
  const url = process.env.SMM_API_URL || "https://realsite.shop/api/v2";

  const res = await fetch(url, {
    method: "POST",
    body: new URLSearchParams({ key, action: "services" }),
  });
  const services: Svc[] = await res.json();
  const products = await prisma.product.findMany({ orderBy: { sortOrder: "asc" } });

  const lines: string[] = [];
  lines.push("# 도매(realsite.shop) ↔ SignalSMM 상품 매핑 리포트");
  lines.push("");
  lines.push(`- 생성일: ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`- 도매 서비스: ${services.length}건 / 우리 상품: ${products.length}건`);
  lines.push(`- 환산 기준: 1 USD = ${USD_KRW.toLocaleString()}원 (rate는 1,000개당 USD)`);
  lines.push("- ※ 임시 계정 기준 — 실계정 전환 시 서비스 ID·단가가 달라질 수 있어 재생성 필요");
  lines.push("");

  // ── 1. 우리 상품별 도매 후보 ──────────────────────────
  lines.push("## 1. 우리 상품별 도매 후보");
  lines.push("");
  const unmatched: string[] = [];

  for (const p of products) {
    const platformKws = PLATFORM_KEYWORDS[p.category] ?? [p.category.toLowerCase()];
    const typeKws = TYPE_KEYWORDS.find(([re]) => re.test(p.name))?.[1] ?? [];
    const korean = /한국인|한국/.test(p.name) ? ["korean", "한국"] : [];

    let cands = services.filter((s) => {
      const h = hay(s);
      const n = s.name.toLowerCase();
      return (
        platformKws.some((k) => h.includes(k)) &&
        // 유형(팔로워/좋아요 등)은 서비스명 기준으로만 — 카테고리명 노이즈 배제
        (typeKws.length === 0 || typeKws.some((k) => n.includes(k))) &&
        (korean.length === 0 || korean.some((k) => n.includes(k))) &&
        Number(s.rate) > 0
      );
    });
    cands.sort((a, b) => Number(a.rate) - Number(b.rate));

    lines.push(`### [${p.category}] ${p.name}`);
    lines.push(
      `- 판매가 **${p.unitPrice.toLocaleString()}원/개** · 수량 ${p.minQty.toLocaleString()}~${p.maxQty.toLocaleString()} · 현재 매핑: ${
        p.providerServiceId ? `#${p.providerServiceId}` : "없음"
      }`,
    );
    if (cands.length === 0) {
      lines.push("- ❌ **도매 후보 없음 — 수동 처리 또는 판매 중단 검토 필요**");
      unmatched.push(`[${p.category}] ${p.name}`);
    } else {
      lines.push("");
      lines.push("| 서비스ID | 도매명 | 원가/개 | 마진 | 도매수량 | 리필 | 범위경고 |");
      lines.push("|---|---|---|---|---|---|---|");
      for (const c of cands.slice(0, 3)) {
        const cost = (Number(c.rate) * USD_KRW) / 1000;
        const margin = cost > 0 ? (p.unitPrice / cost).toFixed(1) : "-";
        const min = Number(c.min);
        const max = Number(c.max);
        const warn = p.minQty < min || p.maxQty > max ? "⚠ 불일치" : "OK";
        lines.push(
          `| ${c.service} | ${c.name.slice(0, 48).replace(/\|/g, "/")} | ${cost.toFixed(2)}원 | ${margin}배 | ${min.toLocaleString()}~${max.toLocaleString()} | ${c.refill ? "O" : "X"} | ${warn} |`,
        );
      }
    }
    lines.push("");
  }

  // ── 2. 플랫폼별 공급 현황 (우리 미판매 vs 도매 보유) ──
  lines.push("## 2. 플랫폼별 공급 현황");
  lines.push("");
  lines.push("메인 STEP01 타일 기준. **우리 상품 0개인데 도매 공급이 있으면 = 상품 추가 기회**,");
  lines.push("**도매 공급 0건이면 = 자동 조달 불가(타 공급처 필요)**.");
  lines.push("");
  lines.push("| 플랫폼 | 우리 상품 | 도매 서비스 | 판정 |");
  lines.push("|---|---|---|---|");

  const cannotSource: string[] = [];
  const opportunity: string[] = [];
  for (const [platform, kws] of Object.entries(PLATFORM_KEYWORDS)) {
    const ourCount = products.filter((p) => p.category === platform).length;
    const provCount = services.filter((s) => kws.some((k) => hay(s).includes(k))).length;
    let verdict = "정상";
    if (ourCount === 0 && provCount > 0) {
      verdict = "🟢 상품 추가 기회";
      opportunity.push(`${platform} (도매 ${provCount}건)`);
    } else if (provCount === 0) {
      verdict = ourCount > 0 ? "🔴 조달 불가 — 수동/타공급처" : "⚪ 양쪽 모두 없음";
      cannotSource.push(platform + (ourCount > 0 ? " (우리 상품 있음!)" : ""));
    }
    lines.push(`| ${platform} | ${ourCount} | ${provCount} | ${verdict} |`);
  }
  lines.push("");

  // ── 3. 요약 ───────────────────────────────────────────
  lines.push("## 3. 액션 요약");
  lines.push("");
  lines.push(`### 우리에게만 있고 도매에 없는 상품 (${unmatched.length}건)`);
  lines.push(unmatched.length ? unmatched.map((u) => `- ${u}`).join("\n") : "- 없음 ✅");
  lines.push("");
  lines.push(`### 도매엔 있는데 우리가 안 파는 플랫폼 (${opportunity.length}건)`);
  lines.push(opportunity.length ? opportunity.map((u) => `- ${u}`).join("\n") : "- 없음");
  lines.push("");
  lines.push(`### 도매에서 조달 불가한 플랫폼 (${cannotSource.length}건)`);
  lines.push(cannotSource.length ? cannotSource.map((u) => `- ${u}`).join("\n") : "- 없음 ✅");
  lines.push("");

  writeFileSync("docs/도매매핑리포트.md", lines.join("\n"), "utf-8");
  console.log("docs/도매매핑리포트.md 생성 완료");
  console.log("우리만 있는 상품:", unmatched.length, "/ 기회 플랫폼:", opportunity.length, "/ 조달불가:", cannotSource.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
