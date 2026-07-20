import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { dispatchOrder } from "@/lib/dispatch";

// ⚠️ 1회용 실주문 테스트 라우트 — 실행 직후 삭제할 것. CRON_SECRET Bearer 보호.
// 지정 유저/상품으로 실제 주문 생성 + 도매 실발주까지 수행(실차감 발생).
export const dynamic = "force-dynamic";

function guard(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET 미설정" }, { status: 503 });
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(req.headers.get("authorization") ?? "");
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return null;
}

export async function POST(req: Request) {
  const denied = guard(req);
  if (denied) return denied;

  const body = (await req.json().catch(() => ({}))) as {
    username?: string;
    productName?: string;
    quantity?: number;
    targetUrl?: string;
    confirm?: string;
  };
  if (body.confirm !== "REAL-DISPATCH")
    return NextResponse.json({ error: "confirm=REAL-DISPATCH 필요(실발주 안전장치)" }, { status: 400 });

  const username = body.username?.trim();
  const productName = body.productName?.trim();
  const quantity = Math.floor(Number(body.quantity));
  const targetUrl = body.targetUrl?.trim();
  if (!username || !productName || !quantity || !targetUrl)
    return NextResponse.json({ error: "username·productName·quantity·targetUrl 필요" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return NextResponse.json({ error: "유저 없음" }, { status: 404 });

  const product = await prisma.product.findFirst({ where: { name: productName } });
  if (!product) return NextResponse.json({ error: "상품 없음" }, { status: 404 });
  if (product.providerServiceId == null)
    return NextResponse.json({ error: "상품이 도매 미연동" }, { status: 400 });
  if (quantity < product.minQty || quantity > product.maxQty)
    return NextResponse.json({ error: `수량 범위 밖(${product.minQty}~${product.maxQty})` }, { status: 400 });

  const total = product.unitPrice * quantity;

  // 테스트용 잔액 보장 — 부족하면 딱 필요한 만큼 증액(관리자 수동 잔액조정과 동일)
  if (user.balance < total) {
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: { increment: total - user.balance } },
    });
  }

  // 주문 생성(PAID) + 잔액 차감 — createOrder와 동일한 원자 처리
  const orderNo = `${Date.now()}${Math.floor(Math.random() * 900000 + 100000)}`;
  let orderId: string;
  try {
    const created = await prisma.$transaction(async (tx) => {
      const dec = await tx.user.updateMany({
        where: { id: user.id, balance: { gte: total } },
        data: { balance: { decrement: total } },
      });
      if (dec.count === 0) throw new Error("INSUFFICIENT");
      return tx.order.create({
        data: {
          orderNo,
          userId: user.id,
          status: "PAID",
          totalAmount: total,
          paidAt: new Date(),
          items: {
            create: {
              productId: product.id,
              productName: product.name,
              unitPrice: product.unitPrice,
              quantity,
              subtotal: total,
              targetUrl,
              providerServiceIdSnapshot: product.providerServiceId,
            },
          },
        },
        select: { id: true },
      });
    });
    orderId = created.id;
  } catch (e) {
    return NextResponse.json({ ok: false, stage: "order", error: String(e) }, { status: 500 });
  }

  // 실제 도매 발주
  const dispatch = await dispatchOrder(orderId);

  const items = await prisma.orderItem.findMany({
    where: { orderId },
    select: { providerOrderId: true, providerStatus: true, providerError: true, sentAt: true },
  });
  const after = await prisma.user.findUnique({ where: { id: user.id }, select: { balance: true } });

  return NextResponse.json({
    ok: dispatch.ok,
    orderNo,
    orderId,
    charged: total,
    balanceAfter: after?.balance,
    dispatch,
    items,
    wholesaleService: product.providerServiceId,
  });
}
