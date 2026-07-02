/**
 * 필수 자동화 QA 검증 시나리오 4선 (+ P0 회귀)
 *
 * 실제 서버 액션 코드를 그대로 import 해서 로컬 PostgreSQL에 대고 실행한다.
 * Next 런타임 의존(next/cache, next/headers, server-only)은 vitest.config.ts
 * alias 스텁으로, 세션 조회(getCurrentUser)는 vi.mock 으로 대체한다.
 *
 * 1. 극한의 동시성  — 잔액 6,000원에 2,000원 주문 8발 동시 → 정확히 3건 성공
 * 2. 멱등성        — 동일 clientKey 5발 동시 → 주문 1건, 차감 1번
 * 3. 악성 페이로드  — 음수/NaN/초과 수량·금액 → 전부 거절
 * 4. Rate Limit    — 로그인 연타 → 6번째부터 차단
 * + P0 회귀        — confirmCharge/refundOrder 동시 2발 → 잔액 반영 정확히 1번
 */
import { describe, it, expect, afterAll, vi } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { RATE_LIMITED_MSG } from "@/lib/ratelimit";
import { __setTestIp } from "../stubs/next-headers";

// getCurrentUser 를 테스트가 제어하는 값으로 대체
const authState: { user: { id: string; role: string } | null } = { user: null };
vi.mock("@/lib/auth", () => ({
  getCurrentUser: async () => authState.user,
}));

import { createOrder, refundOrder } from "@/app/actions/order";
import { createChargeRequest, confirmCharge } from "@/app/actions/charge";
import { loginAction } from "@/app/actions/auth";

const PREFIX = `qa_${Date.now().toString(36)}`;
const createdUserIds: string[] = [];
const createdProductIds: string[] = [];

async function makeUser(balance: number, role = "USER") {
  const u = await prisma.user.create({
    data: {
      username: `${PREFIX}_u${createdUserIds.length}`,
      email: `${PREFIX}_u${createdUserIds.length}@test.local`,
      passwordHash: await bcrypt.hash("Test1234!", 4),
      name: "QA테스트",
      balance,
      role: role as never,
    },
  });
  createdUserIds.push(u.id);
  return u;
}

async function makeProduct(unitPrice: number) {
  const p = await prisma.product.create({
    data: {
      category: "QA테스트",
      name: `${PREFIX}_product`,
      unitPrice,
      minQty: 1,
      maxQty: 1000,
      sortOrder: 9999,
    },
  });
  createdProductIds.push(p.id);
  return p;
}

afterAll(async () => {
  await prisma.notification.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.order.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.chargeRequest.deleteMany({ where: { userId: { in: createdUserIds } } });
  await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await prisma.$disconnect();
});

describe("시나리오 1 — 극한의 동시성 (잔액 초과 차감 방지)", () => {
  it("잔액 6,000원 / 2,000원 주문 8발 동시 → 정확히 3건 성공, 잔액 0원", async () => {
    const user = await makeUser(6_000);
    const product = await makeProduct(2_000);
    authState.user = { id: user.id, role: "USER" };

    const results = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        createOrder({
          productId: product.id,
          quantity: 1,
          targetUrl: `https://example.com/${i}`,
          clientKey: crypto.randomUUID(), // 각기 다른 주문
        }),
      ),
    );

    const okCount = results.filter((r) => r.ok).length;
    expect(okCount).toBe(3);

    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.balance).toBe(0);

    const orderCount = await prisma.order.count({ where: { userId: user.id } });
    expect(orderCount).toBe(3);
  });
});

describe("시나리오 2 — 멱등성 (동일 clientKey 중복 제출)", () => {
  it("동일 clientKey 5발 동시 → 주문 1건만 생성, 차감도 1번", async () => {
    const user = await makeUser(100_000);
    const product = await makeProduct(2_000);
    authState.user = { id: user.id, role: "USER" };
    const key = crypto.randomUUID();

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        createOrder({
          productId: product.id,
          quantity: 1,
          targetUrl: "https://example.com/idem",
          clientKey: key,
        }),
      ),
    );

    // 성공으로 응답한 호출은 전부 같은 주문번호를 돌려받아야 한다
    const okNos = new Set(results.filter((r) => r.ok).map((r) => r.orderNo));
    expect(okNos.size).toBe(1);

    const orderCount = await prisma.order.count({ where: { userId: user.id } });
    expect(orderCount).toBe(1);

    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.balance).toBe(98_000); // 정확히 1번만 차감
  });
});

describe("시나리오 3 — 악성 페이로드 주입", () => {
  it("음수/NaN/범위초과 수량 전부 거절", async () => {
    const user = await makeUser(1_000_000);
    const product = await makeProduct(100);
    authState.user = { id: user.id, role: "USER" };

    for (const quantity of [-100, 0, NaN, Infinity, 1e18, 1001]) {
      const res = await createOrder({
        productId: product.id,
        quantity,
        targetUrl: "https://example.com/x",
      });
      expect(res.ok, `quantity=${quantity} 는 거절되어야 함`).toBe(false);
    }
    expect(await prisma.order.count({ where: { userId: user.id } })).toBe(0);
    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.balance).toBe(1_000_000);
  });

  it("음수/NaN/상한초과 충전 금액 전부 거절", async () => {
    const user = await makeUser(0);
    authState.user = { id: user.id, role: "USER" };

    for (const amount of [-10_000, 0, NaN, 20_000_000]) {
      const res = await createChargeRequest({ amount, depositorName: "홍길동" });
      expect(res.ok, `amount=${amount} 는 거절되어야 함`).toBe(false);
    }
    expect(await prisma.chargeRequest.count({ where: { userId: user.id } })).toBe(0);
  });
});

describe("시나리오 4 — Rate Limit (트래픽 임계치)", () => {
  it("동일 계정 로그인 연타 → 6번째부터 차단", async () => {
    __setTestIp("10.99.0.1");
    const username = `${PREFIX}_bruteforce`;

    const messages: (string | undefined)[] = [];
    for (let i = 0; i < 7; i++) {
      const res = await loginAction({ username, password: "wrong-password" });
      messages.push(res.error);
    }
    // 처음 5번은 인증 실패, 6번째부터는 rate limit
    expect(messages.slice(0, 5).every((m) => m?.includes("올바르지"))).toBe(true);
    expect(messages[5]).toBe(RATE_LIMITED_MSG);
    expect(messages[6]).toBe(RATE_LIMITED_MSG);
  });

  it("주문 API 연타 → 분당 10회 초과 시 차단", async () => {
    const user = await makeUser(10_000_000);
    const product = await makeProduct(10);
    authState.user = { id: user.id, role: "USER" };

    const results: boolean[] = [];
    for (let i = 0; i < 12; i++) {
      const res = await createOrder({
        productId: product.id,
        quantity: 1,
        targetUrl: "https://example.com/rl",
        clientKey: crypto.randomUUID(),
      });
      results.push(res.ok || res.error !== RATE_LIMITED_MSG);
    }
    expect(results.slice(0, 10).every(Boolean)).toBe(true); // 10회까지 통과
    expect(results[10]).toBe(false); // 11번째부터 429 상당
    expect(results[11]).toBe(false);
  });
});

describe("P0 회귀 — 관리자 액션 동시 클릭", () => {
  it("confirmCharge 동시 2발 → 잔액 반영 정확히 1번", async () => {
    const admin = await makeUser(0, "ADMIN");
    const user = await makeUser(0);
    const cr = await prisma.chargeRequest.create({
      data: {
        userId: user.id,
        amount: 50_000,
        vat: 5_000,
        total: 55_000,
        depositorName: "홍길동",
        receiptType: "신청안함",
      },
    });
    authState.user = { id: admin.id, role: "ADMIN" };

    const [a, b] = await Promise.all([confirmCharge(cr.id), confirmCharge(cr.id)]);
    expect([a.ok, b.ok].filter(Boolean).length).toBe(1); // 둘 중 1건만 성공

    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.balance).toBe(50_000); // 이중 증액 없음
  });

  it("refundOrder 동시 2발 → 잔액 복구 정확히 1번, CANCELLED 주문 재환불 불가", async () => {
    const admin = await makeUser(0, "ADMIN");
    const user = await makeUser(0);
    const product = await makeProduct(1_000);
    const order = await prisma.order.create({
      data: {
        orderNo: `${PREFIX}_refund`,
        userId: user.id,
        status: "PAID",
        totalAmount: 3_000,
        paidAt: new Date(),
        items: {
          create: {
            productId: product.id,
            productName: "QA",
            unitPrice: 1_000,
            quantity: 3,
            subtotal: 3_000,
          },
        },
      },
    });
    authState.user = { id: admin.id, role: "ADMIN" };

    const [a, b] = await Promise.all([refundOrder(order.id), refundOrder(order.id)]);
    expect([a.ok, b.ok].filter(Boolean).length).toBe(1);

    const after = await prisma.user.findUnique({ where: { id: user.id } });
    expect(after?.balance).toBe(3_000); // 이중 환불 없음

    // 이미 환불된 주문은 재환불 불가
    const again = await refundOrder(order.id);
    expect(again.ok).toBe(false);
  });
});
