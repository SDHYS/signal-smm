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
] as const;

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
