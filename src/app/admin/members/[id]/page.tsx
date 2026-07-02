import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MemberActions from "@/components/admin/MemberActions";

const won = (n: number) => `${n.toLocaleString()}원`;
const fmt = (d: Date) => new Date(d).toLocaleString("ko-KR");
const fmtDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, ".");

const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: "입금대기", cls: "bg-soft text-gray" },
  PAID: { label: "결제완료", cls: "bg-orange/10 text-orange" },
  PROCESSING: { label: "진행중", cls: "bg-blue/10 text-blue" },
  COMPLETED: { label: "완료", cls: "bg-[#04B014]/10 text-[#04B014]" },
  CANCELLED: { label: "환불", cls: "bg-soft text-gray" },
};
const CHARGE_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "입금대기", cls: "bg-orange/10 text-orange" },
  CONFIRMED: { label: "충전완료", cls: "bg-blue/10 text-blue" },
  CANCELLED: { label: "취소", cls: "bg-soft text-gray" },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2.5 text-sm last:border-0">
      <span className="text-gray">{label}</span>
      <span className="font-medium text-navy">{value}</span>
    </div>
  );
}

function Badge({ meta }: { meta: { label: string; cls: string } }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { items: { take: 1, select: { productName: true, quantity: true } } },
      },
      charges: { orderBy: { createdAt: "desc" }, take: 20 },
      inquiries: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: { select: { orders: true, charges: true, inquiries: true, favorites: true } },
    },
  });
  if (!user) notFound();

  // 집계: 총 결제(환불 제외), 총 충전
  const [paidAgg, chargedAgg] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { userId: id, status: { not: "CANCELLED" } },
    }),
    prisma.chargeRequest.aggregate({
      _sum: { amount: true },
      where: { userId: id, status: "CONFIRMED" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-navy">{user.name}</h1>
          <span className="text-lg text-gray">@{user.username}</span>
          {user.role === "ADMIN" && (
            <span className="rounded-full bg-navy px-2.5 py-0.5 text-xs text-white">관리자</span>
          )}
        </div>
        <Link href="/admin/members" className="text-sm text-navy hover:underline">
          ← 회원 목록
        </Link>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-xl border border-line bg-white p-5">
          <span className="text-sm text-gray">보유 잔액</span>
          <span className="text-2xl font-bold text-navy">{won(user.balance)}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-line bg-white p-5">
          <span className="text-sm text-gray">누적 충전</span>
          <span className="text-2xl font-bold text-blue">{won(chargedAgg._sum.amount ?? 0)}</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-line bg-white p-5">
          <span className="text-sm text-gray">누적 결제</span>
          <span className="text-2xl font-bold text-[#04B014]">{won(paidAgg._sum.totalAmount ?? 0)}</span>
          <span className="text-xs text-gray">환불 제외</span>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-line bg-white p-5">
          <span className="text-sm text-gray">주문 · 문의</span>
          <span className="text-2xl font-bold text-navy">
            {user._count.orders} · {user._count.inquiries}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* 좌: 내역 */}
        <div className="flex flex-col gap-6">
          {/* 주문 내역 */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-navy">
              주문 내역 <span className="text-sm font-normal text-gray">최근 {user.orders.length}건 / 총 {user._count.orders}건</span>
            </h2>
            <div className="overflow-hidden rounded-xl border border-line bg-white">
              {user.orders.length === 0 ? (
                <p className="p-6 text-sm text-gray">주문 내역이 없습니다.</p>
              ) : (
                user.orders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 text-sm last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge meta={ORDER_STATUS[o.status] ?? { label: o.status, cls: "bg-soft text-gray" }} />
                      <span className="font-medium text-navy">{o.items[0]?.productName ?? "주문"}</span>
                      <span className="text-gray">x{o.items[0]?.quantity ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray">
                      <span className="font-medium text-navy">{won(o.totalAmount)}</span>
                      <span className="hidden sm:inline">{fmt(o.createdAt)}</span>
                      <Link href={`/orders/receipt/${o.id}`} className="text-blue underline">
                        영수증
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 충전 내역 */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-navy">
              충전 내역 <span className="text-sm font-normal text-gray">최근 {user.charges.length}건 / 총 {user._count.charges}건</span>
            </h2>
            <div className="overflow-hidden rounded-xl border border-line bg-white">
              {user.charges.length === 0 ? (
                <p className="p-6 text-sm text-gray">충전 내역이 없습니다.</p>
              ) : (
                user.charges.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 text-sm last:border-0">
                    <div className="flex items-center gap-2">
                      <Badge meta={CHARGE_STATUS[c.status] ?? { label: c.status, cls: "bg-soft text-gray" }} />
                      <span className="font-medium text-navy">{won(c.amount)}</span>
                      <span className="text-gray">입금자 {c.depositorName}</span>
                    </div>
                    <span className="text-gray">{fmt(c.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* 문의 내역 */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-navy">
              1:1 문의 <span className="text-sm font-normal text-gray">최근 {user.inquiries.length}건</span>
            </h2>
            <div className="overflow-hidden rounded-xl border border-line bg-white">
              {user.inquiries.length === 0 ? (
                <p className="p-6 text-sm text-gray">문의 내역이 없습니다.</p>
              ) : (
                user.inquiries.map((q) => (
                  <Link
                    key={q.id}
                    href={`/inquiry/${q.id}`}
                    className="flex items-center justify-between gap-3 border-b border-line px-5 py-3 text-sm last:border-0 hover:bg-soft/50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        meta={
                          q.status === "ANSWERED"
                            ? { label: "답변완료", cls: "bg-blue/10 text-blue" }
                            : { label: "답변대기", cls: "bg-orange/10 text-orange" }
                        }
                      />
                      <span className="font-medium text-navy">{q.title}</span>
                    </div>
                    <span className="text-gray">{fmt(q.createdAt)}</span>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        {/* 우: 프로필 + 액션 */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-6">
            <h2 className="text-lg font-semibold text-navy">기본 정보</h2>
            <div className="flex flex-col">
              <InfoRow label="아이디" value={user.username} />
              <InfoRow label="이름" value={user.name} />
              <InfoRow label="이메일" value={user.email} />
              <InfoRow label="연락처" value={user.phone || "-"} />
              <InfoRow label="가입 경로" value={user.signupChannel || "-"} />
              <InfoRow label="가입일" value={fmtDate(user.createdAt)} />
              <InfoRow label="즐겨찾기" value={`${user._count.favorites}개`} />
            </div>
          </div>

          {user.role !== "ADMIN" && (
            <MemberActions userId={user.id} username={user.username} />
          )}
        </div>
      </div>
    </div>
  );
}
