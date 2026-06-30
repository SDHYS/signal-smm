"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type OrderResult = { ok: boolean; error?: string; orderNo?: string };

export async function createOrder(input: {
  productId: string;
  quantity: number;
  targetUrl: string;
}): Promise<OrderResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "로그인이 필요합니다." };

  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });
  if (!product || !product.isActive)
    return { ok: false, error: "존재하지 않는 상품입니다." };

  const qty = Math.floor(input.quantity);
  if (qty < product.minQty || qty > product.maxQty)
    return {
      ok: false,
      error: `수량은 ${product.minQty} ~ ${product.maxQty} 사이여야 합니다.`,
    };

  const targetUrl = input.targetUrl?.trim() ?? "";
  if (!targetUrl) return { ok: false, error: "주문 링크를 입력해주세요." };

  const total = product.unitPrice * qty;
  const orderNo = `${Date.now()}${Math.floor(Math.random() * 90 + 10)}`;

  try {
    await prisma.$transaction(async (tx) => {
      // 잔액 차감(잔액 충분할 때만) — 동시성 방지
      const dec = await tx.user.updateMany({
        where: { id: user.id, balance: { gte: total } },
        data: { balance: { decrement: total } },
      });
      if (dec.count === 0) throw new Error("INSUFFICIENT");

      await tx.order.create({
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
              quantity: qty,
              subtotal: total,
              targetUrl,
            },
          },
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT")
      return { ok: false, error: "잔액이 부족합니다. 충전 후 이용해주세요." };
    console.error("createOrder failed", e);
    return { ok: false, error: "주문 처리 중 오류가 발생했습니다." };
  }

  revalidatePath("/orders");
  revalidatePath("/");
  return { ok: true, orderNo };
}
