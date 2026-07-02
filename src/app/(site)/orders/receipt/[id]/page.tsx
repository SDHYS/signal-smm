import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/components/orders/PrintButton";

const won = (n: number) => `${n.toLocaleString()}원`;
const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, ".");

export default async function ReceiptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const [{ id }, { type }] = await Promise.all([params, searchParams]);
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      user: { select: { name: true, username: true, email: true } },
    },
  });
  if (!order) notFound();
  // 본인 또는 관리자만
  if (order.userId !== user.id && user.role !== "ADMIN") notFound();

  const siteNameRow = await prisma.setting.findUnique({
    where: { key: "site_name" },
  });
  const siteName = siteNameRow?.value ?? "SIGNAL SMM";
  const isStatement = type === "statement";
  const title = isStatement ? "거래명세서" : "영수증";

  const STATUS: Record<string, string> = {
    PENDING_PAYMENT: "입금대기",
    PAID: "결제완료",
    PROCESSING: "진행중",
    COMPLETED: "완료",
    CANCELLED: "환불",
  };

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-8 pt-8">
      {/* 문서 */}
      <div className="flex flex-col gap-8 rounded-2xl border border-line bg-white p-10">
        <div className="flex items-end justify-between border-b-2 border-navy pb-6">
          <h1 className="text-[32px] font-bold text-navy">{title}</h1>
          <span className="text-lg font-semibold text-orange">{siteName}</span>
        </div>

        <div className="grid grid-cols-1 gap-3 text-base sm:grid-cols-2">
          <Info label="주문번호" value={`#${order.orderNo}`} />
          <Info label="발행일" value={fmt(new Date())} />
          <Info label="주문일" value={fmt(order.createdAt)} />
          <Info label="주문상태" value={STATUS[order.status] ?? order.status} />
          <Info label="구매자" value={`${order.user.name} (@${order.user.username})`} />
          <Info label="이메일" value={order.user.email} />
        </div>

        {/* 품목 */}
        <div className="overflow-hidden rounded-lg border border-line">
          <div className="flex bg-soft px-5 py-3 text-sm font-medium text-gray">
            <div className="flex-1">품목</div>
            <div className="w-24 text-right">단가</div>
            <div className="w-20 text-right">수량</div>
            <div className="w-28 text-right">금액</div>
          </div>
          {order.items.map((it) => (
            <div key={it.id} className="flex border-t border-line px-5 py-4 text-sm">
              <div className="flex-1 font-medium text-navy">{it.productName}</div>
              <div className="w-24 text-right text-gray">{won(it.unitPrice)}</div>
              <div className="w-20 text-right text-gray">{it.quantity.toLocaleString()}</div>
              <div className="w-28 text-right font-medium text-navy">{won(it.subtotal)}</div>
            </div>
          ))}
          <div className="flex border-t-2 border-navy bg-soft/50 px-5 py-4 text-base font-semibold">
            <div className="flex-1 text-navy">합계</div>
            <div className="text-orange">{won(order.totalAmount)}</div>
          </div>
        </div>

        <p className="text-sm text-gray">
          본 {title}는 {siteName}에서 발행되었으며, 보유잔액 결제 내역의 증빙으로
          사용하실 수 있습니다.
        </p>
      </div>

      {/* 액션 (인쇄 시 숨김) */}
      <div className="no-print flex items-center justify-center gap-3">
        <PrintButton />
        <Link
          href="/orders"
          className="rounded-lg bg-soft px-8 py-4 text-base font-medium text-gray transition hover:text-navy"
        >
          주문내역으로
        </Link>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex gap-3">
      <span className="w-20 shrink-0 text-gray">{label}</span>
      <span className="font-medium text-navy">{value}</span>
    </p>
  );
}
