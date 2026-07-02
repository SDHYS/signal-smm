"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export type Result = { ok: boolean; error?: string };

async function requireAdmin() {
  const user = await getCurrentUser();
  return user && user.role === "ADMIN" ? user : null;
}

export async function createProduct(input: {
  category: string;
  name: string;
  description?: string;
  unitPrice: number;
  minQty: number;
  maxQty: number;
}): Promise<Result> {
  if (!(await requireAdmin())) return { ok: false, error: "권한이 없습니다." };

  const name = input.name?.trim();
  const category = input.category?.trim();
  if (!name || !category)
    return { ok: false, error: "카테고리와 상품명을 입력해주세요." };
  if (!Number.isFinite(input.unitPrice) || input.unitPrice <= 0)
    return { ok: false, error: "단가는 1원 이상이어야 합니다." };
  if (input.minQty < 1 || input.maxQty < input.minQty)
    return { ok: false, error: "수량 범위가 올바르지 않습니다." };

  const last = await prisma.product.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  await prisma.product.create({
    data: {
      category,
      name,
      description: input.description?.trim() || null,
      unitPrice: Math.floor(input.unitPrice),
      minQty: Math.floor(input.minQty),
      maxQty: Math.floor(input.maxQty),
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function toggleProduct(id: string, isActive: boolean): Promise<Result> {
  if (!(await requireAdmin())) return { ok: false, error: "권한이 없습니다." };
  await prisma.product.update({ where: { id }, data: { isActive } });
  revalidatePath("/");
  revalidatePath("/admin/products");
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<Result> {
  if (!(await requireAdmin())) return { ok: false, error: "권한이 없습니다." };
  try {
    await prisma.product.delete({ where: { id } });
  } catch (e) {
    // P2003 = FK 제약 위반(주문 이력 존재). 그 외 에러는 로그로 원인 보존
    if ((e as { code?: string })?.code === "P2003")
      return {
        ok: false,
        error: "주문에 사용된 상품은 삭제할 수 없습니다. 비활성화로 숨겨주세요.",
      };
    console.error("deleteProduct failed", e);
    return { ok: false, error: "삭제 중 오류가 발생했습니다." };
  }
  revalidatePath("/");
  revalidatePath("/admin/products");
  return { ok: true };
}
