import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";

async function loadSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/**
 * Setting 테이블 전체를 요청당 1회만 읽어 캐시한다 (copy_ 접두 문구 포함).
 * 테이블은 설정 ~40키 + 문구 ~130키로 매우 작아 통읽기가 개별 조회보다 저렴하다.
 * 모든 설정/문구 헬퍼가 이 맵에서 파생되므로 페이지당 DB 왕복이 1회로 수렴한다.
 *
 * 테스트(요청 컨텍스트 없음)에서는 cache가 프로세스 전역처럼 남아 설정 변경이
 * 반영되지 않으므로, VITEST 환경에서는 캐시를 우회한다(설정 변경 검증용).
 */
const cachedLoad = cache(loadSettings);
export function getSettingsMap(): Promise<Record<string, string>> {
  return process.env.VITEST ? loadSettings() : cachedLoad();
}

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

const t = (v: string | undefined) => v?.trim() ?? "";

export async function getCompanyInfo(): Promise<CompanyInfo> {
  const map = await getSettingsMap();
  return {
    name: t(map.company_name),
    ceo: t(map.company_ceo),
    bizno: t(map.company_bizno),
    mailorder: t(map.company_mailorder),
    address: t(map.company_address),
    email: t(map.company_email),
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
  const map = await getSettingsMap();
  const orange = t(map.theme_color_orange);
  const navy = t(map.theme_color_navy);
  const blue = t(map.theme_color_blue);
  const out: ThemeColors = {};
  if (HEX_RE.test(orange)) {
    out.orange = orange;
    out.orangeSoft = shade(orange, 0.25);
    out.orangeDeep = shade(orange, -0.3);
  }
  if (HEX_RE.test(navy)) out.navy = navy;
  if (HEX_RE.test(blue)) {
    out.blue = blue;
    out.blueSoft = shade(blue, 0.45);
  }
  return out;
}

export async function getLogoUrl(): Promise<string> {
  const map = await getSettingsMap();
  return t(map.logo_url) || "/brand/logo-main.png";
}

export const DEFAULT_SIGNUP_CHANNELS = ["구글", "네이버", "아이보스", "지인", "인스타"];

export async function getSignupChannels(): Promise<string[]> {
  const map = await getSettingsMap();
  const raw = t(map.signup_channels);
  if (!raw) return DEFAULT_SIGNUP_CHANNELS;
  const parsed = raw.split(",").map((v) => v.trim()).filter(Boolean);
  return parsed.length > 0 ? parsed.slice(0, 12) : DEFAULT_SIGNUP_CHANNELS;
}

/** 부가세율 (0~20%, 기본 10) */
export async function getVatRate(): Promise<number> {
  const map = await getSettingsMap();
  const raw = t(map.vat_rate);
  if (raw === "") return 10; // 미설정 → 기본 10% (Number("")===0 폴백 방지)
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 20) return 10;
  return Math.round(n);
}

export const DEFAULT_CHARGE_PRESETS = [
  10000, 30000, 50000, 70000, 100000, 300000, 500000, 1000000,
];

export async function getChargePresets(): Promise<number[]> {
  const map = await getSettingsMap();
  const raw = t(map.charge_presets);
  if (!raw) return DEFAULT_CHARGE_PRESETS;
  const parsed = raw
    .split(",")
    .map((v) => Number(v.trim()))
    .filter((n) => Number.isSafeInteger(n) && n > 0);
  return parsed.length > 0 ? parsed : DEFAULT_CHARGE_PRESETS;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const map = await getSettingsMap();
  return Object.fromEntries(
    (SETTING_KEYS as readonly string[]).filter((k) => k in map).map((k) => [k, map[k]]),
  );
}

export async function getBankInfo(): Promise<BankInfo> {
  const map = await getSettingsMap();
  return {
    bankName: map.bank_name ?? "",
    account: map.bank_account ?? "",
    holder: map.bank_holder ?? "",
  };
}

export async function getSupportInfo(): Promise<SupportInfo> {
  const map = await getSettingsMap();
  return {
    kakao: t(map.support_kakao),
    phone: t(map.support_phone),
  };
}
