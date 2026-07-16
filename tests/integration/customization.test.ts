/**
 * 커스터마이징 설정 검증 — 부가세율/가입경로/프리셋/테마색 파싱과
 * 금액 계산 반영 (설정별 기본값 폴백 포함)
 */
import { describe, it, expect, afterAll, beforeEach, vi } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const authState: { user: { id: string; role: string } | null } = { user: null };
vi.mock("@/lib/auth", () => ({
  getCurrentUser: async () => authState.user,
}));

import { createChargeRequest } from "@/app/actions/charge";
import {
  getVatRate,
  getSignupChannels,
  getChargePresets,
  getThemeColors,
  DEFAULT_SIGNUP_CHANNELS,
  DEFAULT_CHARGE_PRESETS,
} from "@/lib/settings";

const PREFIX = `qc_${Date.now().toString(36)}`;
const userIds: string[] = [];
const SETTING_KEYS = ["vat_rate", "signup_channels", "charge_presets", "theme_color_orange"];

async function setSetting(key: string, value: string) {
  await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
}
async function clearSettings() {
  await prisma.setting.deleteMany({ where: { key: { in: SETTING_KEYS } } });
}

beforeEach(clearSettings);

afterAll(async () => {
  await clearSettings();
  await prisma.chargeRequest.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe("부가세율", () => {
  it("미설정=10%, 0 설정 시 부가세 없음, 범위초과는 10%로 폴백", async () => {
    expect(await getVatRate()).toBe(10);
    await setSetting("vat_rate", "0");
    expect(await getVatRate()).toBe(0);
    await setSetting("vat_rate", "99");
    expect(await getVatRate()).toBe(10);
    await setSetting("vat_rate", "abc");
    expect(await getVatRate()).toBe(10);
  });

  it("충전 신청 금액 계산에 반영 (0% → vat 0, total=amount)", async () => {
    const u = await prisma.user.create({
      data: {
        username: `${PREFIX}_u0`,
        email: `${PREFIX}_u0@test.local`,
        passwordHash: await bcrypt.hash("Test1234!", 4),
        name: "QC",
      },
    });
    userIds.push(u.id);
    authState.user = { id: u.id, role: "USER" };

    await setSetting("vat_rate", "0");
    const r = await createChargeRequest({ amount: 10_000, depositorName: "홍길동" });
    expect(r.ok).toBe(true);
    const cr = await prisma.chargeRequest.findUnique({ where: { id: r.id! } });
    expect(cr?.vat).toBe(0);
    expect(cr?.total).toBe(10_000);
  });
});

describe("가입경로/프리셋/테마 파싱", () => {
  it("가입경로: 쉼표 파싱·공백 제거·빈 값은 기본값", async () => {
    expect(await getSignupChannels()).toEqual(DEFAULT_SIGNUP_CHANNELS);
    await setSetting("signup_channels", " 유튜브 ,  친구소개 ,, 검색 ");
    expect(await getSignupChannels()).toEqual(["유튜브", "친구소개", "검색"]);
  });

  it("프리셋: 숫자만 통과, 전부 무효면 기본값", async () => {
    await setSetting("charge_presets", "5000, abc, 20000, -3");
    expect(await getChargePresets()).toEqual([5000, 20000]);
    await setSetting("charge_presets", "abc, -1");
    expect(await getChargePresets()).toEqual(DEFAULT_CHARGE_PRESETS);
  });

  it("테마색: 유효 hex만 채택 + 그라디언트 파생색 자동 생성", async () => {
    await setSetting("theme_color_orange", "#10B981");
    const t = await getThemeColors();
    expect(t.orange).toBe("#10B981");
    expect(t.orangeSoft).toMatch(/^#[0-9a-f]{6}$/i);
    expect(t.orangeDeep).toMatch(/^#[0-9a-f]{6}$/i);
    await setSetting("theme_color_orange", "red");
    expect((await getThemeColors()).orange).toBeUndefined();
  });
});
