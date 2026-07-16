import "server-only";
import { prisma } from "./prisma";

export type BankInfo = { bankName: string; account: string; holder: string };
export type SupportInfo = { kakao: string; phone: string };

export const SETTING_KEYS = [
  "site_name",
  "bank_name",
  "bank_account",
  "bank_holder",
  "support_kakao", // 카카오톡 채널 ID 또는 채널 링크(http…)
  "support_phone", // 고객센터 전화번호
  "about_intro", // 회사소개 본문 (줄바꿈 유지)
  // 사업자 정보 (푸터·영수증 법정 표기)
  "company_name", // 상호
  "company_ceo", // 대표자
  "company_bizno", // 사업자등록번호
  "company_mailorder", // 통신판매업신고번호
  "company_address", // 사업장 주소
  "company_email", // 대표 이메일
  // 약관/개인정보처리방침 본문
  "terms_content",
  "privacy_content",
  // SEO 메타
  "seo_title",
  "seo_description",
  // 충전 프리셋 금액 (쉼표 구분, 원 단위)
  "charge_presets",
  // 브랜딩/테마
  "logo_url", // 로고 이미지 URL (미설정 시 기본 로고)
  "theme_color_orange", // 포인트(주황) — 버튼·강조
  "theme_color_navy", // 본문 짙은색
  "theme_color_blue", // 보조 파랑
  // 회원가입
  "signup_channels", // 가입경로 선택지 (쉼표 구분)
  // 결제
  "vat_rate", // 부가세율 % (0~20, 기본 10)
] as const;

export type CompanyInfo = {
  name: string;
  ceo: string;
  bizno: string;
  mailorder: string;
  address: string;
  email: string;
};

export async function getCompanyInfo(): Promise<CompanyInfo> {
  const keys = [
    "company_name",
    "company_ceo",
    "company_bizno",
    "company_mailorder",
    "company_address",
    "company_email",
  ];
  const rows = await prisma.setting.findMany({ where: { key: { in: keys } } });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value.trim()]));
  return {
    name: map.company_name ?? "",
    ceo: map.company_ceo ?? "",
    bizno: map.company_bizno ?? "",
    mailorder: map.company_mailorder ?? "",
    address: map.company_address ?? "",
    email: map.company_email ?? "",
  };
}

// ── 테마 색상 ─────────────────────────────────────────
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** hex 밝기 조절 (amt -1.0 어둡게 ~ +1.0 밝게) — 주문버튼 그라디언트 파생색용 */
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) =>
    Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(ch);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export type ThemeColors = {
  orange?: string;
  orangeSoft?: string;
  orangeDeep?: string;
  navy?: string;
  blue?: string;
  blueSoft?: string;
};

/** 어드민 설정 테마색 — 유효한 hex만 반환, 파생색(soft/deep) 자동 계산 */
export async function getThemeColors(): Promise<ThemeColors> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["theme_color_orange", "theme_color_navy", "theme_color_blue"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value.trim()]));
  const out: ThemeColors = {};
  if (HEX_RE.test(map.theme_color_orange ?? "")) {
    out.orange = map.theme_color_orange;
    out.orangeSoft = shade(map.theme_color_orange, 0.25);
    out.orangeDeep = shade(map.theme_color_orange, -0.3);
  }
  if (HEX_RE.test(map.theme_color_navy ?? "")) out.navy = map.theme_color_navy;
  if (HEX_RE.test(map.theme_color_blue ?? "")) {
    out.blue = map.theme_color_blue;
    out.blueSoft = shade(map.theme_color_blue, 0.45);
  }
  return out;
}

export async function getLogoUrl(): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key: "logo_url" } });
  const v = row?.value.trim() ?? "";
  return v || "/brand/로고텍스트일체형.png";
}

export const DEFAULT_SIGNUP_CHANNELS = ["구글", "네이버", "아이보스", "지인", "인스타"];

export async function getSignupChannels(): Promise<string[]> {
  const row = await prisma.setting.findUnique({ where: { key: "signup_channels" } });
  if (!row?.value.trim()) return DEFAULT_SIGNUP_CHANNELS;
  const parsed = row.value.split(",").map((v) => v.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed.slice(0, 12) : DEFAULT_SIGNUP_CHANNELS;
}

/** 부가세율 (0~20%, 기본 10) */
export async function getVatRate(): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: "vat_rate" } });
  const n = Number(row?.value.trim());
  if (!Number.isFinite(n) || n < 0 || n > 20) return 10;
  return Math.round(n);
}

export const DEFAULT_CHARGE_PRESETS = [
  10000, 30000, 50000, 70000, 100000, 300000, 500000, 1000000,
];

export async function getChargePresets(): Promise<number[]> {
  const row = await prisma.setting.findUnique({ where: { key: "charge_presets" } });
  if (!row?.value.trim()) return DEFAULT_CHARGE_PRESETS;
  const parsed = row.value
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isSafeInteger(n) && n > 0);
  return parsed.length > 0 ? parsed : DEFAULT_CHARGE_PRESETS;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: [...SETTING_KEYS] } },
  });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getBankInfo(): Promise<BankInfo> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["bank_name", "bank_account", "bank_holder"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    bankName: map.bank_name ?? "",
    account: map.bank_account ?? "",
    holder: map.bank_holder ?? "",
  };
}

export async function getSupportInfo(): Promise<SupportInfo> {
  const rows = await prisma.setting.findMany({
    where: { key: { in: ["support_kakao", "support_phone"] } },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    kakao: map.support_kakao?.trim() ?? "",
    phone: map.support_phone?.trim() ?? "",
  };
}
