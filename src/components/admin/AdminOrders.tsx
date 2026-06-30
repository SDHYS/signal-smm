"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setOrderStatus, refundOrder } from "@/app/actions/order";

export type AdminOrder = {
  id: string;
  orderNo: string;
  status: "PAID" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "PENDING_PAYMENT";
  total: number;
  userName: string;
  username: string;
  productName: string;
  quantity: number;
  targetUrl: string | null;
  createdAt: string;
};

const STATUS: Record<AdminOrder["status"], { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: "입금대기", cls: "bg-soft text-gray" },
  PAID: { label: "결제완료", cls: "bg-orange/10 text-orange" },
  PROCESSING: { label: "진행중", cls: "bg-blue/10 text-blue" },
  COMPLETED: { label: "완료", cls: "bg-[#04B014]/10 text-[#04B014]" },
  CANCELLED: { label: "환불", cls: "bg-soft text-gray" },
};

const won = (n: number) => `${n.toLocaleString()}원`;

export default function AdminOrders({ orders }: { orders: AdminOrder[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, fn: () => Promise<{ ok: boolean }>) {
    setBusy(id);
    await fn();
    setBusy(null);
    router.refresh();
  }

  if (orders.length === 0)
    return (
      <p className="rounded-xl border border-line bg-white p-8 text-base text-gray">
        주문이 없습니다.
      </p>
    );

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      {orders.map((o) => (
        <div key={o.id} className="flex flex-col gap-3 border-b border-line p-5 last:border-0 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS[o.status].cls}`}>
                {STATUS[o.status].label}
              </span>
              <span className="text-base font-medium text-navy">{o.productName}</span>
              <span className="text-sm text-gray">x{o.quantity.toLocaleString()}</span>
            </div>
            <span className="text-sm text-gray">
              {o.userName} (@{o.username}) · #{o.orderNo} · {won(o.total)} ·{" "}
              {new Date(o.createdAt).toLocaleString("ko-KR")}
            </span>
            {o.targetUrl && (
              <span className="truncate text-xs text-gray">링크: {o.targetUrl}</span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {o.status === "PAID" && (
              <button
                onClick={() => act(o.id, () => setOrderStatus(o.id, "PROCESSING"))}
                disabled={busy === o.id}
                className="rounded bg-blue px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
              >
                진행중으로
              </button>
            )}
            {o.status === "PROCESSING" && (
              <button
                onClick={() => act(o.id, () => setOrderStatus(o.id, "COMPLETED"))}
                disabled={busy === o.id}
                className="rounded bg-[#04B014] px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
              >
                완료로
              </button>
            )}
            {o.status !== "CANCELLED" && o.status !== "COMPLETED" && (
              <button
                onClick={() => act(o.id, () => refundOrder(o.id))}
                disabled={busy === o.id}
                className="rounded border border-line px-3 py-2 text-xs font-medium text-gray disabled:opacity-50"
              >
                환불
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
