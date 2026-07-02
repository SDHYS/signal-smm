import HeroSection from "@/components/home/HeroSection";
import OrderIntro from "@/components/home/OrderIntro";
import OrderFlow from "@/components/home/OrderFlow";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function mask(username: string) {
  return `${username.slice(0, 2)}***`;
}

function timeAgo(d: Date) {
  const mins = Math.max(1, Math.floor((Date.now() - d.getTime()) / 60000));
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 ${mins % 60}분 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const [user, products, latestOrder] = await Promise.all([
    getCurrentUser(),
    prisma.product.findMany({
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
    }),
    // 실시간 주문 티커용 최근 주문 1건
    prisma.order.findFirst({
      where: { status: { not: "CANCELLED" } },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        user: { select: { username: true } },
        items: { take: 1, select: { productName: true, quantity: true } },
      },
    }),
  ]);

  const ticker = latestOrder
    ? `[${timeAgo(latestOrder.createdAt)}] ${mask(latestOrder.user.username)} 님이 ${
        latestOrder.items[0]?.productName ?? "서비스"
      } ${latestOrder.items[0]?.quantity.toLocaleString() ?? ""}개를 주문했어요!`
    : null;

  return (
    <div className="flex flex-col gap-8 pt-2">
      <HeroSection />
      <OrderIntro ticker={ticker} />
      <OrderFlow
        isLoggedIn={!!user}
        balance={user?.balance ?? 0}
        products={products}
        query={q}
      />
    </div>
  );
}
