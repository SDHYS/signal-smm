import HeroSection from "@/components/home/HeroSection";
import OrderIntro from "@/components/home/OrderIntro";
import OrderFlow from "@/components/home/OrderFlow";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const user = await getCurrentUser();
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      category: true,
      name: true,
      description: true,
      unitPrice: true,
      minQty: true,
      maxQty: true,
    },
  });

  return (
    <div className="flex flex-col gap-8 pt-2">
      <HeroSection />
      <OrderIntro />
      <OrderFlow
        isLoggedIn={!!user}
        balance={user?.balance ?? 0}
        products={products}
        query={q}
      />
    </div>
  );
}
