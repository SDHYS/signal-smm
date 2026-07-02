import { prisma } from "@/lib/prisma";
import AdminProducts, { type ProductItem } from "@/components/admin/AdminProducts";

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
  }));

  return <AdminProducts products={products} />;
}
