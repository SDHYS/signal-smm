import { prisma } from "@/lib/prisma";
import AdminProducts, {
  type ProductItem,
  type ProviderService,
} from "@/components/admin/AdminProducts";
import { getBalance, getServices, smmConfigured, usdKrw } from "@/lib/smm";

// 빌드 타임 프리렌더에서 도매 API를 호출하지 않도록 요청 시 렌더 고정
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const rows = await prisma.product.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { orderItems: true } } },
  });

  const products: ProductItem[] = rows.map((p) => ({
    id: p.id,
    category: p.category,
    name: p.name,
    unitPrice: p.unitPrice,
    minQty: p.minQty,
    maxQty: p.maxQty,
    isActive: p.isActive,
    orderCount: p._count.orderItems,
    providerServiceId: p.providerServiceId,
    providerRate: p.providerRate,
    providerMeta: p.providerMeta,
  }));

  // 도매 연동 정보 (키 미설정/장애 시에도 페이지는 떠야 한다)
  const configured = smmConfigured();
  let services: ProviderService[] = [];
  let providerBalance: string | null = null;
  let providerError: string | null = null;
  if (configured) {
    try {
      const [svc, bal] = await Promise.all([getServices(), getBalance()]);
      services = svc.map((s) => ({
        service: s.service,
        name: s.name,
        category: s.category,
        rate: Number(s.rate) || 0,
        min: Number(s.min) || 0,
        max: Number(s.max) || 0,
        refill: s.refill,
        cancel: s.cancel,
      }));
      providerBalance = `$${Number(bal.balance).toFixed(2)}`;
    } catch (e) {
      console.error("admin/products: provider fetch failed", e);
      providerError = "도매 API 조회 실패 — 매핑 기능이 일시적으로 제한됩니다.";
    }
  }

  return (
    <AdminProducts
      products={products}
      configured={configured}
      services={services}
      providerBalance={providerBalance}
      providerError={providerError}
      usdKrw={usdKrw()}
    />
  );
}
