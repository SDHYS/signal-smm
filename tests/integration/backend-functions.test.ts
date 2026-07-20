/**
 * 백엔드 기능 심층 검증 — 인증/프로필/즐겨찾기/알림/상태전이/관리자 액션의
 * 유효성 검사·권한(IDOR)·비즈니스 규칙을 실제 서버 액션 코드로 검증한다.
 */
import { describe, it, expect, afterAll, vi } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { __setTestIp } from "../stubs/next-headers";

const authState: { user: { id: string; role: string; name?: string } | null } = { user: null };
vi.mock("@/lib/auth", () => ({
  getCurrentUser: async () => authState.user,
}));

import { signupAction, loginAction } from "@/app/actions/auth";
import { updateProfile, changePassword, findUsername } from "@/app/actions/user";
import { toggleFavorite } from "@/app/actions/favorite";
import { markNotificationRead, sendMessage } from "@/app/actions/notification";
import {
  cancelMyCharge,
  createChargeRequest,
  confirmCharge,
  confirmChargesBulk,
} from "@/app/actions/charge";
import { createOrder, setOrderStatus } from "@/app/actions/order";
import { adjustBalance } from "@/app/actions/members";
import { answerInquiry } from "@/app/actions/inquiry";
import { deleteProduct, updateProductPricing } from "@/app/actions/product";
import { rateLimit } from "@/lib/ratelimit";

const PREFIX = `qb_${Date.now().toString(36)}`;
const userIds: string[] = [];
const productIds: string[] = [];

async function makeUser(balance = 0, role = "USER") {
  const n = userIds.length;
  const u = await prisma.user.create({
    data: {
      username: `${PREFIX}_u${n}`,
      email: `${PREFIX}_u${n}@test.local`,
      passwordHash: await bcrypt.hash("Test1234!", 4),
      name: "QB테스트",
      balance,
      role: role as never,
    },
  });
  userIds.push(u.id);
  return u;
}

async function makeProduct(unitPrice = 100, isActive = true) {
  const p = await prisma.product.create({
    data: {
      category: "QB테스트",
      name: `${PREFIX}_p${productIds.length}`,
      unitPrice,
      minQty: 1,
      maxQty: 1000,
      isActive,
      sortOrder: 9999,
    },
  });
  productIds.push(p.id);
  return p;
}

const asUser = (u: { id: string; name?: string }) =>
  (authState.user = { id: u.id, role: "USER", name: u.name });
const asAdmin = (u: { id: string; name?: string }) =>
  (authState.user = { id: u.id, role: "ADMIN", name: u.name ?? "관리자" });
const asGuest = () => (authState.user = null);

afterAll(async () => {
  const where = { userId: { in: userIds } };
  await prisma.adminAuditLog.deleteMany({ where: { targetId: { in: userIds } } });
  await prisma.rateLimit.deleteMany({});
  await prisma.notification.deleteMany({ where });
  await prisma.favorite.deleteMany({ where });
  await prisma.inquiry.deleteMany({ where });
  await prisma.order.deleteMany({ where });
  await prisma.chargeRequest.deleteMany({ where });
  await prisma.product.deleteMany({ where: { id: { in: productIds } } });
  await prisma.user.deleteMany({
    where: { OR: [{ id: { in: userIds } }, { username: { startsWith: PREFIX } }] },
  });
  await prisma.$disconnect();
});

describe("인증 — 가입/로그인 검증", () => {
  it("중복 아이디/이메일, 짧은 아이디, 잘못된 이메일, 비번 불일치 전부 거절", async () => {
    __setTestIp("10.90.0.1");
    const existing = await makeUser();

    const base = {
      username: `${PREFIX}_new`,
      email: `${PREFIX}_new@test.local`,
      password: "Test1234!",
      passwordConfirm: "Test1234!",
    };
    // 중복 아이디
    let r = await signupAction({ ...base, username: existing.username });
    expect(r.error).toContain("이미 사용 중인 아이디");
    // 중복 이메일
    r = await signupAction({ ...base, email: existing.email });
    expect(r.error).toContain("이미 가입된 이메일");
    // 짧은 아이디 / 형식 오류 / 불일치
    expect((await signupAction({ ...base, username: "ab" })).ok).toBe(false);
    expect((await signupAction({ ...base, email: "not-an-email" })).ok).toBe(false);
    expect((await signupAction({ ...base, passwordConfirm: "Different1!" })).ok).toBe(false);
    expect((await signupAction({ ...base, password: "short", passwordConfirm: "short" })).ok).toBe(false);
  });

  it("로그인: 없는 계정과 틀린 비번이 같은 메시지 (계정 존재 비노출)", async () => {
    __setTestIp("10.90.0.2");
    const u = await makeUser();
    const wrong = await loginAction({ username: u.username, password: "bad-pass-1" });
    const ghost = await loginAction({ username: `${PREFIX}_ghost`, password: "bad-pass-1" });
    expect(wrong.error).toBe(ghost.error);
    const ok = await loginAction({ username: u.username, password: "Test1234!" });
    expect(ok.ok).toBe(true);
  });
});

describe("프로필/비밀번호", () => {
  it("타인이 쓰는 이메일로 변경 불가, 내 이메일 유지 저장은 허용", async () => {
    const a = await makeUser();
    const b = await makeUser();
    asUser(a);
    const dup = await updateProfile({ name: "이름", email: b.email });
    expect(dup.error).toContain("이미 사용 중인 이메일");
    const keep = await updateProfile({ name: "이름", email: a.email, phone: "01012345678" });
    expect(keep.ok).toBe(true);
  });

  it("현재 비밀번호가 틀리면 변경 거부, 맞으면 새 비번으로 로그인 가능", async () => {
    __setTestIp("10.90.0.3");
    const u = await makeUser();
    asUser(u);
    expect((await changePassword({ current: "wrong!", next: "NewPass123!" })).ok).toBe(false);
    expect((await changePassword({ current: "Test1234!", next: "NewPass123!" })).ok).toBe(true);
    expect((await loginAction({ username: u.username, password: "NewPass123!" })).ok).toBe(true);
  });

  it("아이디 찾기: 마스킹 형식 (앞2 + * + 끝1), 없는 이메일은 에러", async () => {
    __setTestIp("10.90.0.4");
    const u = await makeUser();
    const found = await findUsername(u.email);
    expect(found.ok).toBe(true);
    expect(found.data).toMatch(/^.{2}\*+.$/);
    expect(found.data).not.toBe(u.username);
    expect((await findUsername(`${PREFIX}_none@test.local`)).ok).toBe(false);
  });
});

describe("즐겨찾기/알림 — 소유권", () => {
  it("즐겨찾기 토글: 추가→해제, 비로그인 거절", async () => {
    const u = await makeUser();
    const p = await makeProduct();
    asUser(u);
    await toggleFavorite(p.id);
    expect(await prisma.favorite.count({ where: { userId: u.id, productId: p.id } })).toBe(1);
    await toggleFavorite(p.id);
    expect(await prisma.favorite.count({ where: { userId: u.id, productId: p.id } })).toBe(0);
    asGuest();
    expect((await toggleFavorite(p.id)).ok).toBe(false);
  });

  it("IDOR: 타인의 알림을 읽음 처리할 수 없다", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const n = await prisma.notification.create({
      data: { userId: b.id, type: "system", title: "B의 알림" },
    });
    asUser(a);
    await markNotificationRead(n.id); // 에러는 안 나지만 아무것도 못 바꿔야 함
    const after = await prisma.notification.findUnique({ where: { id: n.id } });
    expect(after?.read).toBe(false);
  });

  it("IDOR: 타인의 충전 신청을 취소할 수 없다", async () => {
    const a = await makeUser();
    const b = await makeUser();
    const cr = await prisma.chargeRequest.create({
      data: { userId: b.id, amount: 10000, vat: 1000, total: 11000, depositorName: "B", receiptType: "신청안함" },
    });
    asUser(a);
    expect((await cancelMyCharge(cr.id)).ok).toBe(false);
    const after = await prisma.chargeRequest.findUnique({ where: { id: cr.id } });
    expect(after?.status).toBe("PENDING");
  });

  it("관리자 쪽지: 없는 아이디는 에러, 일반 유저 호출은 권한 거절", async () => {
    const admin = await makeUser(0, "ADMIN");
    const u = await makeUser();
    asAdmin(admin);
    expect((await sendMessage({ username: `${PREFIX}_nouser`, body: "hi" })).ok).toBe(false);
    expect((await sendMessage({ username: u.username, body: "안내드립니다" })).ok).toBe(true);
    asUser(u);
    expect((await sendMessage({ username: u.username, body: "hi" })).ok).toBe(false);
  });
});

describe("주문 — targetUrl 보안 검증", () => {
  it("javascript:/잘못된 스킴 링크 거절, http(s)만 허용", async () => {
    const u = await makeUser(1_000_000);
    const p = await makeProduct(100);
    asUser(u);
    for (const link of ["javascript:alert(1)", "data:text/html,x", "not a url", "ftp://x.com"]) {
      const r = await createOrder({ productId: p.id, quantity: 1, targetUrl: link });
      expect(r.ok, `${link} 는 거절되어야 함`).toBe(false);
    }
    const ok = await createOrder({ productId: p.id, quantity: 1, targetUrl: "https://instagram.com/p/x" });
    expect(ok.ok).toBe(true);
    expect(await prisma.order.count({ where: { userId: u.id } })).toBe(1); // 정상 1건만
  });
});

describe("주문 — 상품 상태/권한/상태전이", () => {
  it("비활성/존재하지 않는 상품 주문 거절, 비로그인 거절", async () => {
    const u = await makeUser(100_000);
    const inactive = await makeProduct(100, false);
    asUser(u);
    expect((await createOrder({ productId: inactive.id, quantity: 1, targetUrl: "https://x.com" })).ok).toBe(false);
    expect((await createOrder({ productId: "no-such-id", quantity: 1, targetUrl: "https://x.com" })).ok).toBe(false);
    asGuest();
    const p = await makeProduct();
    expect((await createOrder({ productId: p.id, quantity: 1, targetUrl: "https://x.com" })).ok).toBe(false);
  });

  it("상태전이 매트릭스: 정방향만 허용, 환불된 주문 되살리기 불가, 일반유저 거절", async () => {
    const admin = await makeUser(0, "ADMIN");
    const u = await makeUser();
    const p = await makeProduct();
    const mk = (status: string) =>
      prisma.order.create({
        data: {
          orderNo: `${PREFIX}_${status}_${Math.random().toString(36).slice(2, 8)}`,
          userId: u.id,
          status: status as never,
          totalAmount: 100,
          items: { create: { productId: p.id, productName: "t", unitPrice: 100, quantity: 1, subtotal: 100 } },
        },
      });

    asAdmin(admin);
    // 정방향: PAID → PROCESSING → COMPLETED
    const o1 = await mk("PAID");
    expect((await setOrderStatus(o1.id, "PROCESSING")).ok).toBe(true);
    expect((await setOrderStatus(o1.id, "COMPLETED")).ok).toBe(true);
    // 역방향/건너뛰기 차단
    expect((await setOrderStatus(o1.id, "PAID")).ok).toBe(false); // COMPLETED → PAID 불가
    const cancelled = await mk("CANCELLED");
    expect((await setOrderStatus(cancelled.id, "PAID")).ok).toBe(false);
    expect((await setOrderStatus(cancelled.id, "PROCESSING")).ok).toBe(false);
    expect((await setOrderStatus(cancelled.id, "COMPLETED")).ok).toBe(false);
    // 일반 유저 권한 거절
    const o2 = await mk("PAID");
    asUser(u);
    expect((await setOrderStatus(o2.id, "PROCESSING")).error).toContain("권한");
  });

  it("도매 발주된 주문은 수동 '완료' 불가 (자동 잔여환불 무효화 방지)", async () => {
    const admin = await makeUser(0, "ADMIN");
    const u = await makeUser();
    const p = await makeProduct();
    const o = await prisma.order.create({
      data: {
        orderNo: `${PREFIX}_dispatched_${Math.random().toString(36).slice(2, 8)}`,
        userId: u.id,
        status: "PROCESSING",
        totalAmount: 100,
        items: {
          create: {
            productId: p.id, productName: "t", unitPrice: 100, quantity: 1, subtotal: 100,
            providerOrderId: "DISPATCHED1", providerStatus: "In progress", sentAt: new Date(),
          },
        },
      },
    });
    asAdmin(admin);
    const r = await setOrderStatus(o.id, "COMPLETED");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("도매");
    const after = await prisma.order.findUnique({ where: { id: o.id } });
    expect(after?.status).toBe("PROCESSING"); // 변경 안 됨
  });
});

describe("관리자 — 잔액조정/문의답변/상품삭제", () => {
  it("잔액 차감은 보유액 초과 불가, 0원 조정 거절, 일반유저 거절", async () => {
    const admin = await makeUser(0, "ADMIN");
    const u = await makeUser(5_000);
    asAdmin(admin);
    expect((await adjustBalance(u.id, -10_000)).ok).toBe(false); // 초과 차감
    expect((await adjustBalance(u.id, 0)).ok).toBe(false);
    expect((await adjustBalance(u.id, -3_000)).ok).toBe(true);
    expect((await adjustBalance(u.id, 1_000)).ok).toBe(true);
    const after = await prisma.user.findUnique({ where: { id: u.id } });
    expect(after?.balance).toBe(3_000); // 5000 - 3000 + 1000
    asUser(u);
    expect((await adjustBalance(u.id, 999_999)).ok).toBe(false);
  });

  it("문의 답변: 빈 답변 거절, 일반유저 거절, 정상 답변 시 상태 전환+알림", async () => {
    const admin = await makeUser(0, "ADMIN");
    const u = await makeUser();
    const q = await prisma.inquiry.create({
      data: { userId: u.id, title: "질문", content: "내용" },
    });
    asUser(u);
    expect((await answerInquiry(q.id, "답")).ok).toBe(false);
    asAdmin(admin);
    expect((await answerInquiry(q.id, "   ")).ok).toBe(false);
    expect((await answerInquiry(q.id, "답변입니다")).ok).toBe(true);
    const after = await prisma.inquiry.findUnique({ where: { id: q.id } });
    expect(after?.status).toBe("ANSWERED");
    expect(await prisma.notification.count({ where: { userId: u.id, type: "inquiry" } })).toBe(1);
  });

  it("상품 삭제: 주문 이력 있으면 안내 메시지로 거절, 없으면 삭제", async () => {
    const admin = await makeUser(0, "ADMIN");
    const u = await makeUser();
    const used = await makeProduct();
    await prisma.order.create({
      data: {
        orderNo: `${PREFIX}_del_${Math.random().toString(36).slice(2, 8)}`,
        userId: u.id,
        status: "PAID",
        totalAmount: 100,
        items: { create: { productId: used.id, productName: "t", unitPrice: 100, quantity: 1, subtotal: 100 } },
      },
    });
    const unused = await makeProduct();
    asAdmin(admin);
    const blocked = await deleteProduct(used.id);
    expect(blocked.ok).toBe(false);
    expect(blocked.error).toContain("비활성화");
    expect((await deleteProduct(unused.id)).ok).toBe(true);
    asUser(u);
    expect((await deleteProduct(used.id)).ok).toBe(false); // 권한
  });
});

describe("상품 가격 수정", () => {
  it("검증(0원/역전 범위/권한) 거절, 정상 수정 반영 — 기존 주문 스냅샷은 불변", async () => {
    const admin = await makeUser(0, "ADMIN");
    const u = await makeUser(10_000);
    const p = await makeProduct(100);
    // 기존 주문 생성 (단가 100 스냅샷)
    asUser(u);
    const o = await createOrder({ productId: p.id, quantity: 10, targetUrl: "https://x.com/p" });
    expect(o.ok).toBe(true);

    asAdmin(admin);
    expect((await updateProductPricing(p.id, { unitPrice: 0, minQty: 1, maxQty: 10 })).ok).toBe(false);
    expect((await updateProductPricing(p.id, { unitPrice: 100, minQty: 50, maxQty: 10 })).ok).toBe(false);
    asUser(u);
    expect((await updateProductPricing(p.id, { unitPrice: 999, minQty: 1, maxQty: 10 })).ok).toBe(false);

    asAdmin(admin);
    const r = await updateProductPricing(p.id, { unitPrice: 250, minQty: 5, maxQty: 500 });
    expect(r.ok).toBe(true);
    const after = await prisma.product.findUnique({ where: { id: p.id } });
    expect(after?.unitPrice).toBe(250);
    expect(after?.minQty).toBe(5);
    // 기존 주문 아이템 단가는 스냅샷 그대로
    const item = await prisma.orderItem.findFirst({ where: { productId: p.id } });
    expect(item?.unitPrice).toBe(100);
  });
});

describe("충전 — 입력 검증", () => {
  it("입금자명 없으면 거절, 영수증 상세는 빈 값 제거 후 저장", async () => {
    // 다른 테스트 파일이 남긴 부가세율 설정과 격리 (기본 10% 가정)
    await prisma.setting.deleteMany({ where: { key: "vat_rate" } });
    const u = await makeUser();
    asUser(u);
    expect((await createChargeRequest({ amount: 10_000, depositorName: "  " })).ok).toBe(false);
    const r = await createChargeRequest({
      amount: 10_000,
      depositorName: "홍길동",
      receiptType: "세금계산서",
      receiptDetail: { 회사명: "테스트(주)", 이메일: "", 대표자: " " },
    });
    expect(r.ok).toBe(true);
    const cr = await prisma.chargeRequest.findUnique({ where: { id: r.id! } });
    expect(cr?.vat).toBe(1_000);
    expect(cr?.total).toBe(11_000);
    const detail = JSON.parse(cr?.receiptDetail ?? "{}");
    expect(detail).toEqual({ 회사명: "테스트(주)" }); // 빈 값 제거 확인
  });
});

describe("충전 — 입금확인/부분입금/벌크 + 감사 로그", () => {
  async function pendingCharge(userId: string, amount = 10_000) {
    return prisma.chargeRequest.create({
      data: {
        userId,
        amount,
        vat: Math.round(amount * 0.1),
        total: Math.round(amount * 1.1),
        depositorName: "홍길동",
        receiptType: "신청안함",
      },
    });
  }

  it("입금확인: 신청액을 잔액에 적립하고 감사 로그(charge.confirm) 기록", async () => {
    const admin = await makeUser(0, "ADMIN");
    const u = await makeUser(0);
    const cr = await pendingCharge(u.id, 10_000);
    asAdmin(admin);
    expect((await confirmCharge(cr.id)).ok).toBe(true);
    const after = await prisma.user.findUnique({ where: { id: u.id } });
    expect(after?.balance).toBe(10_000); // 신청액 적립 (부가세 제외)
    const log = await prisma.adminAuditLog.findFirst({
      where: { action: "charge.confirm", targetId: cr.id },
    });
    expect(log?.amount).toBe(10_000);
    expect(log?.adminName).toBe(admin.name);
  });

  it("부분입금: 실제 입금액만 적립하고 charge.confirm.partial 로그", async () => {
    const admin = await makeUser(0, "ADMIN");
    const u = await makeUser(0);
    const cr = await pendingCharge(u.id, 50_000);
    asAdmin(admin);
    // 신청 5만원인데 실제 3만원만 입금됨
    expect((await confirmCharge(cr.id, { creditAmount: 30_000 })).ok).toBe(true);
    const after = await prisma.user.findUnique({ where: { id: u.id } });
    expect(after?.balance).toBe(30_000); // 신청액 아닌 실제 적립액
    const log = await prisma.adminAuditLog.findFirst({
      where: { action: "charge.confirm.partial", targetId: cr.id },
    });
    expect(log?.amount).toBe(30_000);
  });

  it("이중확인 방지: 이미 확인된 신청 재확인은 실패하고 잔액 재적립 없음", async () => {
    const admin = await makeUser(0, "ADMIN");
    const u = await makeUser(0);
    const cr = await pendingCharge(u.id, 10_000);
    asAdmin(admin);
    expect((await confirmCharge(cr.id)).ok).toBe(true);
    expect((await confirmCharge(cr.id)).ok).toBe(false); // 이미 처리됨
    const after = await prisma.user.findUnique({ where: { id: u.id } });
    expect(after?.balance).toBe(10_000); // 1회만 적립
  });

  it("벌크 확인: 여러 대기 신청을 일괄 확인, 각 회원 잔액 반영", async () => {
    const admin = await makeUser(0, "ADMIN");
    const u1 = await makeUser(0);
    const u2 = await makeUser(0);
    const c1 = await pendingCharge(u1.id, 10_000);
    const c2 = await pendingCharge(u2.id, 20_000);
    asAdmin(admin);
    const res = await confirmChargesBulk([c1.id, c2.id]);
    expect(res.confirmed).toBe(2);
    expect(res.failed).toBe(0);
    expect((await prisma.user.findUnique({ where: { id: u1.id } }))?.balance).toBe(10_000);
    expect((await prisma.user.findUnique({ where: { id: u2.id } }))?.balance).toBe(20_000);
  });

  it("일반 유저는 입금확인/벌크 거절", async () => {
    const u = await makeUser(0);
    const cr = await pendingCharge(u.id);
    asUser(u);
    expect((await confirmCharge(cr.id)).ok).toBe(false);
    expect((await confirmChargesBulk([cr.id])).ok).toBe(false);
    expect((await prisma.chargeRequest.findUnique({ where: { id: cr.id } }))?.status).toBe("PENDING");
  });
});

describe("rate limit — DB 공유 카운터 (서버리스 다중 인스턴스 대응)", () => {
  it("윈도우 내 max회까지 허용하고 초과는 차단", async () => {
    const key = `k_${Date.now().toString(36)}`;
    const seq: boolean[] = [];
    for (let i = 0; i < 5; i++) {
      seq.push(await rateLimit("rltest", { max: 3, windowMs: 60_000, key }));
    }
    expect(seq).toEqual([true, true, true, false, false]);
  });

  it("서로 다른 key는 독립적으로 카운트", async () => {
    const a = `ka_${Date.now().toString(36)}`;
    const b = `kb_${Date.now().toString(36)}`;
    expect(await rateLimit("rltest", { max: 1, windowMs: 60_000, key: a })).toBe(true);
    expect(await rateLimit("rltest", { max: 1, windowMs: 60_000, key: a })).toBe(false);
    // 다른 key는 영향 없음
    expect(await rateLimit("rltest", { max: 1, windowMs: 60_000, key: b })).toBe(true);
  });

  it("윈도우 만료 후 리셋되어 다시 허용", async () => {
    const key = `kr_${Date.now().toString(36)}`;
    expect(await rateLimit("rlreset", { max: 1, windowMs: 60, key })).toBe(true);
    expect(await rateLimit("rlreset", { max: 1, windowMs: 60, key })).toBe(false);
    await new Promise((r) => setTimeout(r, 90));
    expect(await rateLimit("rlreset", { max: 1, windowMs: 60, key })).toBe(true);
  });
});
