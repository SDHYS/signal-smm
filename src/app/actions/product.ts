"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getServices, smmConfigured } from "@/lib/smm";
import { overLen, LIMITS } from "@/lib/validate";

export type Result = { ok: boolean; error?: string };

// 32-bit Int 컬럼 상한 아래로 제한 — 초과 값은 앱 검증 통과 후 INSERT에서 int4 overflow(500)
const MAX_INT = 2_000_000_000;

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
  if (overLen(name, LIMITS.shortText) || overLen(category, LIMITS.shortText) || overLen(input.description, LIMITS.content))
    return { ok: false, error: "입력이 너무 깁니다." };
  if (!Number.isFinite(input.unitPrice) || input.unitPrice <= 0 || input.unitPrice > MAX_INT)
    return { ok: false, error: "단가가 올바르지 않습니다." };
  if (
    !Number.isFinite(input.minQty) ||
    !Number.isFinite(input.maxQty) ||
    input.minQty < 1 ||
    input.maxQty < input.minQty ||
    input.maxQty > MAX_INT
  )
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

// 판매가·수량 범위 수정 — 기존 주문은 스냅샷(OrderItem.unitPrice) 저장이라 영향 없음
export async function updateProductPricing(
  id: string,
  input: { unitPrice: number; minQty: number; maxQty: number },
): Promise<Result> {
  if (!(await requireAdmin())) return { ok: false, error: "권한이 없습니다." };

  const unitPrice = Math.floor(input.unitPrice);
  const minQty = Math.floor(input.minQty);
  const maxQty = Math.floor(input.maxQty);
  if (!Number.isSafeInteger(unitPrice) || unitPrice < 1 || unitPrice > MAX_INT)
    return { ok: false, error: "단가가 올바르지 않습니다." };
  if (!Number.isSafeInteger(minQty) || minQty < 1 || !Number.isSafeInteger(maxQty) || maxQty < minQty || maxQty > MAX_INT)
    return { ok: false, error: "수량 범위가 올바르지 않습니다." };

  const upd = await prisma.product.updateMany({
    where: { id },
    data: { unitPrice, minQty, maxQty },
  });
  if (upd.count === 0) return { ok: false, error: "상품을 찾을 수 없습니다." };

  revalidatePath("/");
  revalidatePath("/admin/products");
  return { ok: true };
}

// 도매(공급사) 서비스 매핑 — serviceId가 null이면 연동 해제
export async function setProviderService(
  productId: string,
  serviceId: number | null,
): Promise<Result> {
  if (!(await requireAdmin())) return { ok: false, error: "권한이 없습니다." };

  if (serviceId === null) {
    const cleared = await prisma.product.updateMany({
      where: { id: productId },
      data: { providerServiceId: null, providerRate: null, providerMeta: null },
    });
    if (cleared.count === 0) return { ok: false, error: "상품을 찾을 수 없습니다." };
    revalidatePath("/admin/products");
    return { ok: true };
  }

  if (!smmConfigured())
    return { ok: false, error: "SMM_API_KEY가 설정되지 않았습니다." };
  if (!Number.isSafeInteger(serviceId) || serviceId <= 0)
    return { ok: false, error: "서비스 ID가 올바르지 않습니다." };

  // 실존하는 서비스인지 도매 목록에서 검증 후 스냅샷 저장
  let svc;
  try {
    svc = (await getServices()).find((s) => s.service === serviceId);
  } catch (e) {
    console.error("setProviderService: getServices failed", e);
    return { ok: false, error: "도매 API 조회에 실패했습니다. 잠시 후 다시 시도해주세요." };
  }
  if (!svc) return { ok: false, error: `도매에 없는 서비스 ID입니다: ${serviceId}` };

  const mapped = await prisma.product.updateMany({
    where: { id: productId },
    data: {
      providerServiceId: serviceId,
      providerRate: Number(svc.rate) || 0,
      providerMeta: JSON.stringify({
        name: svc.name,
        category: svc.category,
        min: Number(svc.min),
        max: Number(svc.max),
        type: svc.type,
        refill: svc.refill,
        cancel: svc.cancel,
        mappedAt: new Date().toISOString(),
      }),
    },
  });
  if (mapped.count === 0) return { ok: false, error: "상품을 찾을 수 없습니다." };

  revalidatePath("/admin/products");
  return { ok: true };
}

export async function toggleProduct(id: string, isActive: boolean): Promise<Result> {
  if (!(await requireAdmin())) return { ok: false, error: "권한이 없습니다." };
  const upd = await prisma.product.updateMany({ where: { id }, data: { isActive } });
  if (upd.count === 0) return { ok: false, error: "상품을 찾을 수 없습니다." };
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
