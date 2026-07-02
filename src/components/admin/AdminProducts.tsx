"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, toggleProduct, deleteProduct } from "@/app/actions/product";

export type ProductItem = {
  id: string;
  category: string;
  name: string;
  unitPrice: number;
  minQty: number;
  maxQty: number;
  isActive: boolean;
  orderCount: number;
};

// STEP01 타일과 이름이 일치해야 플랫폼 필터에 잡힌다
const categorySuggestions = [
  "인스타그램",
  "유튜브",
  "틱톡",
  "페이스북",
  "텔레그램",
  "카카오",
  "쓰레드",
  "X트위터",
  "네이버",
  "네이버플레이스",
  "네이버블로그",
];

const won = (n: number) => `${n.toLocaleString()}원`;

export default function AdminProducts({ products }: { products: ProductItem[] }) {
  const router = useRouter();
  const [category, setCategory] = useState("인스타그램");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [minQty, setMinQty] = useState("10");
  const [maxQty, setMaxQty] = useState("10000");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setError(null);
    setSaving(true);
    const res = await createProduct({
      category,
      name,
      description,
      unitPrice: Number(unitPrice) || 0,
      minQty: Number(minQty) || 1,
      maxQty: Number(maxQty) || 1,
    });
    setSaving(false);
    if (res.ok) {
      setName("");
      setDescription("");
      setUnitPrice("");
      router.refresh();
    } else setError(res.error ?? "등록 실패");
  }

  async function onToggle(p: ProductItem) {
    await toggleProduct(p.id, !p.isActive);
    router.refresh();
  }

  async function onDelete(p: ProductItem) {
    const res = await deleteProduct(p.id);
    if (!res.ok) alert(res.error);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-navy">상품 관리</h1>
        <p className="text-base text-gray">
          카테고리는 메인 STEP01 플랫폼 이름과 일치해야 필터에 연동됩니다.
        </p>
      </div>

      {/* 등록 */}
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-6">
        <div className="flex flex-wrap gap-2">
          {categorySuggestions.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                category === c ? "bg-blue text-white" : "bg-soft text-gray-2"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="상품명 (예: 인스타그램 한국인 팔로워)"
            className="flex-1 rounded border border-line px-4 py-3 text-sm text-navy focus:border-blue focus:outline-none"
          />
          <input
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="단가(원)"
            className="w-full rounded border border-line px-4 py-3 text-sm text-navy focus:border-blue focus:outline-none sm:w-32"
          />
          <input
            value={minQty}
            onChange={(e) => setMinQty(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="최소수량"
            className="w-full rounded border border-line px-4 py-3 text-sm text-navy focus:border-blue focus:outline-none sm:w-28"
          />
          <input
            value={maxQty}
            onChange={(e) => setMaxQty(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="최대수량"
            className="w-full rounded border border-line px-4 py-3 text-sm text-navy focus:border-blue focus:outline-none sm:w-28"
          />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="상품 설명 (선택)"
          rows={2}
          className="w-full resize-y rounded border border-line px-4 py-3 text-sm text-navy focus:border-blue focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={submit}
            disabled={saving}
            className="rounded-lg bg-navy px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "등록 중..." : "상품 등록"}
          </button>
          {error && <span className="text-sm text-[#ED1C24]">{error}</span>}
        </div>
      </div>

      {/* 목록 */}
      <div className="overflow-hidden rounded-xl border border-line bg-white">
        {products.length === 0 ? (
          <p className="p-8 text-base text-gray">등록된 상품이 없습니다.</p>
        ) : (
          products.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-2 border-b border-line px-6 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col">
                <span className="flex items-center gap-2 font-medium text-navy">
                  {!p.isActive && (
                    <span className="rounded-full bg-soft px-2 py-0.5 text-xs text-gray">
                      비활성
                    </span>
                  )}
                  [{p.category}] {p.name}
                </span>
                <span className="text-sm text-gray">
                  단가 {won(p.unitPrice)} · 수량 {p.minQty.toLocaleString()}~
                  {p.maxQty.toLocaleString()} · 누적 주문 {p.orderCount}건
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => onToggle(p)}
                  className={`rounded px-3 py-2 text-xs font-medium ${
                    p.isActive
                      ? "border border-line text-gray hover:bg-soft"
                      : "bg-blue text-white"
                  }`}
                >
                  {p.isActive ? "비활성화" : "활성화"}
                </button>
                <button
                  onClick={() => onDelete(p)}
                  className="rounded border border-line px-3 py-2 text-xs font-medium text-gray hover:bg-soft"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
