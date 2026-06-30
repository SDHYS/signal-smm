import "server-only";
import { prisma } from "./prisma";

export type BankInfo = { bankName: string; account: string; holder: string };

export const SETTING_KEYS = [
  "site_name",
  "bank_name",
  "bank_account",
  "bank_holder",
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
