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
