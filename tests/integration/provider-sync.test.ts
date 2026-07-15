/**
 * 도매 연동 통합 테스트 — 발주(dispatch)·상태 동기화(sync)·환불 시 도매취소.
 *
 * 도매 API는 fetch 스텁으로 모킹 (외부 호출 없음). Prisma는 실DB.
 * 돈이 걸린 경로 검증이 핵심: Partial 부분환불 멱등성, 도매취소 전액환불 1회.
 */
import { describe, it, expect, afterAll, afterEach, vi } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

process.env.SMM_API_KEY ||= "test-key-for-stubbed-fetch";
// 이 파일은 fetch를 스텁하므로 발주 차단 스위치를 해제하고 실제 코드 경로를 검증
delete process.env.SMM_DISPATCH_DISABLED;

const authState: { user: { id: string; role: string } | null } = { user: null };
vi.mock("@/lib/auth", () => ({
  getCurrentUser: async () => authState.user,
}));

import { dispatchOrderItem } from "@/lib/dispatch";
import { syncProviderOrders } from "@/lib/sync-orders";
import { refundOrder } from "@/app/actions/order";

const PREFIX = `qp_${Date.now().toString(36)}`;
const userIds: string[] = [];
const productIds: string[] = [];

// ── 도매 API fetch 스텁 ───────────────────────────────
type SmmHandler = (action: string, params: URLSearchParams) => unknown;
const fetchCalls: { action: string; params: URLSearchParams }[] = [];

function stubSmm(handler: SmmHandler) {
  fetchCalls.length = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: unknown, init?: { body?: unknown }) => {
      const params = init?.body as URLSearchParams;
      const action = params.get("action")!;
      fetchCalls.push({ action, params });
      return new Response(JSON.stringify(handler(action, params)));
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

// ── 픽스처 ────────────────────────────────────────────
async function makeUser(balance = 0, role = "USER") {
  const n = userIds.length;
  const u = await prisma.user.create({
    data: {
      username: `${PREFIX}_u${n}`,
      email: `${PREFIX}_u${n}@test.local`,
      passwordHash: await bcrypt.hash("Test1234!", 4),
      name: "QP테스트",
      balance,
      role: role as never,
    },
  });
  userIds.push(u.id);
  return u;
}

async function makeProduct(providerServiceId: number | null) {
  const p = await prisma.product.create({
    data: {
      category: "QP테스트",
      name: `${PREFIX}_p${productIds.length}`,
      unitPrice: 100,
      minQty: 1,
      maxQty: 100000,
      sortOrder: 9999,
      providerServiceId,
    },
  });
  productIds.push(p.id);
  return p;
}

async function makeOrder(opts: {
  userId: string;
  productId: string;
  quantity: number;
  providerOrderId?: string;
  status?: string;
}) {
  return prisma.order.create({
    data: {
      orderNo: `${PREFIX}_${Math.random().toString(36).slice(2, 10)}`,
      userId: opts.userId,
      status: (opts.status ?? "PAID") as never,
      totalAmount: opts.quantity * 100,
      paidAt: new Date(),
      items: {
        create: {
          productId: opts.productId,
          productName: "QP",
          unitPrice: 100,
          quantity: opts.quantity,
          subtotal: opts.quantity * 100,
          targetUrl: "https://example.com/qp",
          providerOrderId: opts.providerOrderId ?? null,
          providerStatus: opts.providerOrderId ? "Pending" : null,
          sentAt: opts.providerOrderId ? new Date() : null,
        },
      },
    },
    include: { items: true },
  });
}

afterAll(async () => {
  const where = { userId: { in: userIds } };
  await prisma.notification.deleteMany({ where });
  await prisma.order.deleteMany({ where });
  await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
});

describe("발주 (dispatchOrderItem)", () => {
  it("미연동 상품 → 발주 스킵, 도매 호출 없음", async () => {
    const u = await makeUser();
    const p = await makeProduct(null);
    const o = await makeOrder({ userId: u.id, productId: p.id, quantity: 10 });
    stubSmm(() => ({ order: 1 }));

    const r = await dispatchOrderItem(o.items[0].id);
    expect(r).toEqual({ ok: true, skipped: true });
    expect(fetchCalls.length).toBe(0);
    // 스킵 상태 정리: 이후 sync 테스트에 안 걸리게 종결
    await prisma.order.update({ where: { id: o.id }, data: { status: "COMPLETED" } });
  });

  it("연동 상품 → add 발주, 주문번호·시각 저장 + 재호출 시 멱등", async () => {
    const u = await makeUser();
    const p = await makeProduct(4189);
    const o = await makeOrder({ userId: u.id, productId: p.id, quantity: 50 });
    stubSmm((action, params) => {
      expect(action).toBe("add");
      expect(params.get("service")).toBe("4189");
      expect(params.get("quantity")).toBe("50");
      expect(params.get("link")).toBe("https://example.com/qp");
      return { order: 99001 };
    });

    const r = await dispatchOrderItem(o.items[0].id);
    expect(r.ok).toBe(true);

    const item = await prisma.orderItem.findUnique({ where: { id: o.items[0].id } });
    expect(item?.providerOrderId).toBe("99001");
    expect(item?.providerStatus).toBe("Pending");
    expect(item?.sentAt).not.toBeNull();
    expect(item?.providerError).toBeNull();

    // 멱등: 이미 발주됨 → 도매 재호출 없음
    const before = fetchCalls.length;
    const r2 = await dispatchOrderItem(o.items[0].id);
    expect(r2.ok).toBe(true);
    expect(fetchCalls.length).toBe(before);
    await prisma.order.update({ where: { id: o.id }, data: { status: "COMPLETED" } });
  });

  it("도매 에러(잔액부족 등) → providerError 기록, 주문은 PAID 유지", async () => {
    const u = await makeUser();
    const p = await makeProduct(4189);
    const o = await makeOrder({ userId: u.id, productId: p.id, quantity: 10 });
    stubSmm(() => ({ error: "Not enough funds" }));

    const r = await dispatchOrderItem(o.items[0].id);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("Not enough funds");

    const item = await prisma.orderItem.findUnique({ where: { id: o.items[0].id } });
    expect(item?.providerOrderId).toBeNull();
    expect(item?.providerError).toContain("Not enough funds");
    const order = await prisma.order.findUnique({ where: { id: o.id } });
    expect(order?.status).toBe("PAID"); // 주문은 살아있음 (재발주 대상)
    await prisma.order.update({ where: { id: o.id }, data: { status: "COMPLETED" } });
  });
});

describe("상태 동기화 (syncProviderOrders)", () => {
  it("Completed → 주문 완료 + 알림", async () => {
    const u = await makeUser();
    const p = await makeProduct(4189);
    const o = await makeOrder({ userId: u.id, productId: p.id, quantity: 10, providerOrderId: "77001" });
    stubSmm(() => ({ charge: "0.1", start_count: "0", status: "Completed", remains: "0", currency: "USD" }));

    await syncProviderOrders();

    const order = await prisma.order.findUnique({ where: { id: o.id } });
    expect(order?.status).toBe("COMPLETED");
    expect(order?.completedAt).not.toBeNull();
    expect(
      await prisma.notification.count({ where: { userId: u.id, title: { contains: "완료" } } }),
    ).toBe(1);
  });

  it("Partial → 잔여수량 환불 + 완료, 두 번 실행해도 환불은 1회", async () => {
    const u = await makeUser(0);
    const p = await makeProduct(4189);
    // 100개 주문 중 30개 미처리 → 30 × 100원 = 3,000원 환불 기대
    const o = await makeOrder({ userId: u.id, productId: p.id, quantity: 100, providerOrderId: "77002" });
    stubSmm(() => ({ status: "Partial", remains: "30" }));

    await syncProviderOrders();
    await syncProviderOrders(); // 중복 실행 (멱등성 검증)

    const after = await prisma.user.findUnique({ where: { id: u.id } });
    expect(after?.balance).toBe(3_000); // 정확히 1회만 환불

    const order = await prisma.order.findUnique({ where: { id: o.id } });
    expect(order?.status).toBe("COMPLETED");
    expect(order?.adminMemo).toContain("부분완료");
    const item = await prisma.orderItem.findUnique({ where: { id: o.items[0].id } });
    expect(item?.providerRemains).toBe(30);
  });

  it("Canceled → 전액 환불 + 주문 취소", async () => {
    const u = await makeUser(0);
    const p = await makeProduct(4189);
    const o = await makeOrder({ userId: u.id, productId: p.id, quantity: 20, providerOrderId: "77003" });
    stubSmm(() => ({ status: "Canceled" }));

    await syncProviderOrders();
    await syncProviderOrders(); // 멱등성

    const after = await prisma.user.findUnique({ where: { id: u.id } });
    expect(after?.balance).toBe(2_000); // 20 × 100원, 1회만

    const order = await prisma.order.findUnique({ where: { id: o.id } });
    expect(order?.status).toBe("CANCELLED");
  });

  it("In progress → 주문 진행중 전환", async () => {
    const u = await makeUser();
    const p = await makeProduct(4189);
    const o = await makeOrder({ userId: u.id, productId: p.id, quantity: 10, providerOrderId: "77004" });
    stubSmm(() => ({ status: "In progress", remains: "5" }));

    await syncProviderOrders();

    const order = await prisma.order.findUnique({ where: { id: o.id } });
    expect(order?.status).toBe("PROCESSING");
    await prisma.order.update({ where: { id: o.id }, data: { status: "COMPLETED" } });
  });
});

describe("관리자 환불 → 도매 취소 연동", () => {
  it("발주된 주문 환불 시 도매 cancel 호출 + 잔액 복구 1회", async () => {
    const admin = await makeUser(0, "ADMIN");
    const u = await makeUser(0);
    const p = await makeProduct(4189);
    const o = await makeOrder({ userId: u.id, productId: p.id, quantity: 10, providerOrderId: "77005" });
    stubSmm((action) => {
      if (action === "cancel") return [{ order: 77005, cancel: 1 }];
      return {};
    });

    authState.user = { id: admin.id, role: "ADMIN" };
    const r = await refundOrder(o.id);
    expect(r.ok).toBe(true);

    // 도매 취소가 실제로 요청됐는지
    const cancelCall = fetchCalls.find((c) => c.action === "cancel");
    expect(cancelCall).toBeDefined();
    expect(cancelCall!.params.get("orders")).toBe("77005");

    const after = await prisma.user.findUnique({ where: { id: u.id } });
    expect(after?.balance).toBe(1_000); // 10 × 100원
  });

  it("도매 취소 실패해도 환불 자체는 성공 (best-effort)", async () => {
    const admin = await makeUser(0, "ADMIN");
    const u = await makeUser(0);
    const p = await makeProduct(4189);
    const o = await makeOrder({ userId: u.id, productId: p.id, quantity: 5, providerOrderId: "77006" });
    stubSmm((action) => {
      if (action === "cancel") throw new Error("network down");
      return {};
    });

    authState.user = { id: admin.id, role: "ADMIN" };
    const r = await refundOrder(o.id);
    expect(r.ok).toBe(true); // 취소 실패와 무관하게 환불 완료

    const after = await prisma.user.findUnique({ where: { id: u.id } });
    expect(after?.balance).toBe(500);
  });
});
