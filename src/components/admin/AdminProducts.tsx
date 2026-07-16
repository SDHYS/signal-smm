"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createProduct,
  toggleProduct,
  deleteProduct,
  setProviderService,
  updateProductPricing,
} from "@/app/actions/product";

export type ProductItem = {
  id: string;
  category: string;
  name: string;
  unitPrice: number;
  minQty: number;
  maxQty: number;
  isActive: boolean;
  orderCount: number;
  providerServiceId: number | null;
  providerRate: number | null;
  providerMeta: string | null;
};

export type ProviderService = {
  service: number;
  name: string;
  category: string;
  rate: number; // USD / 1000개
  min: number;
  max: number;
  refill: boolean;
  cancel: boolean;
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

function parseMeta(meta: string | null): { name?: string; min?: number; max?: number } {
  if (!meta) return {};
  try {
    return JSON.parse(meta);
  } catch {
    return {};
  }
}

// ── 판매가 편집기: 도매 원가 대비 마진 실시간 표시 ────
function PriceEditor({ p, usdKrw }: { p: ProductItem; usdKrw: number }) {
  const router = useRouter();
  const [price, setPrice] = useState(String(p.unitPrice));
  const [minQ, setMinQ] = useState(String(p.minQty));
  const [maxQ, setMaxQ] = useState(String(p.maxQty));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // 도매 원가/개 (매핑된 상품만) + 입력값 기준 실시간 마진
  const costPerUnit = p.providerRate !== null ? (p.providerRate * usdKrw) / 1000 : null;
  const priceNum = Number(price) || 0;
  const margin = costPerUnit && costPerUnit > 0 && priceNum > 0 ? priceNum / costPerUnit : null;
  const changed =
    price !== String(p.unitPrice) || minQ !== String(p.minQty) || maxQ !== String(p.maxQty);

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await updateProductPricing(p.id, {
      unitPrice: Number(price) || 0,
      minQty: Number(minQ) || 0,
      maxQty: Number(maxQ) || 0,
    });
    setBusy(false);
    if (res.ok) {
      setMsg("저장됨");
      setTimeout(() => setMsg(null), 1500);
      router.refresh();
    } else setMsg(res.error ?? "저장 실패");
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      <label className="flex items-center gap-1.5">
        <span className="text-gray">판매가</span>
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
          aria-label={`${p.name} 판매가`}
          className="w-24 rounded border border-line px-2.5 py-1.5 text-right text-sm text-navy focus:border-blue focus:outline-none"
        />
        <span className="text-gray">원</span>
      </label>
      <label className="flex items-center gap-1.5">
        <span className="text-gray">수량</span>
        <input
          value={minQ}
          onChange={(e) => setMinQ(e.target.value.replace(/[^0-9]/g, ""))}
          aria-label={`${p.name} 최소수량`}
          className="w-20 rounded border border-line px-2.5 py-1.5 text-right text-sm text-navy focus:border-blue focus:outline-none"
        />
        <span className="text-gray">~</span>
        <input
          value={maxQ}
          onChange={(e) => setMaxQ(e.target.value.replace(/[^0-9]/g, ""))}
          aria-label={`${p.name} 최대수량`}
          className="w-24 rounded border border-line px-2.5 py-1.5 text-right text-sm text-navy focus:border-blue focus:outline-none"
        />
      </label>
      {/* 도매 원가 + 실시간 마진 */}
      {costPerUnit !== null ? (
        <span className="text-gray">
          도매가 <span className="font-medium text-navy">{costPerUnit.toFixed(2)}원/개</span>
          {margin !== null && (
            <span className={margin < 1.5 ? "font-medium text-[#ED1C24]" : "text-[#04B014]"}>
              {" "}→ 마진 {margin.toFixed(1)}배
            </span>
          )}
        </span>
      ) : (
        <span className="text-muted">도매가 — (미연동)</span>
      )}
      <button
        onClick={save}
        disabled={busy || !changed}
        className="rounded bg-navy px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
      >
        {busy ? "저장 중..." : "가격 저장"}
      </button>
      {msg && <span className="text-xs font-medium text-blue">{msg}</span>}
    </div>
  );
}

// ── 도매 연동 패널 (상품 행 하단) ─────────────────────
function ProviderPanel({
  p,
  services,
  configured,
  usdKrw,
}: {
  p: ProductItem;
  services: ProviderService[];
  configured: boolean;
  usdKrw: number;
}) {
  const router = useRouter();
  const [svcId, setSvcId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = parseMeta(p.providerMeta);
  const mapped = p.providerServiceId !== null;
  const costPerUnit = p.providerRate !== null ? (p.providerRate * usdKrw) / 1000 : null;
  const margin =
    costPerUnit !== null && costPerUnit > 0 ? p.unitPrice / costPerUnit : null;
  // 수량 범위 불일치 경고
  const rangeWarn =
    mapped &&
    meta.min !== undefined &&
    meta.max !== undefined &&
    (p.minQty < meta.min || p.maxQty > meta.max);

  async function link() {
    const id = Number(svcId);
    if (!id) return setError("서비스 ID를 입력해주세요.");
    setBusy(true);
    setError(null);
    const res = await setProviderService(p.id, id);
    setBusy(false);
    if (!res.ok) return setError(res.error ?? "연동 실패");
    setSvcId("");
    router.refresh();
  }

  async function unlink() {
    if (!confirm("도매 연동을 해제할까요? 이후 주문은 수동 처리됩니다.")) return;
    setBusy(true);
    await setProviderService(p.id, null);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-lg bg-soft/60 px-4 py-3 text-sm">
      {mapped ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-medium text-blue">도매 연동 #{p.providerServiceId}</span>
          <span className="max-w-[420px] truncate text-gray" title={meta.name}>
            {meta.name ?? "-"}
          </span>
          {costPerUnit !== null && (
            <span className="text-gray">
              원가 <span className="font-medium text-navy">{costPerUnit.toFixed(2)}원/개</span>
              {margin !== null && (
                <span className={margin < 1.5 ? "text-[#ED1C24]" : "text-[#04B014]"}>
                  {" "}
                  (마진 {margin.toFixed(1)}배)
                </span>
              )}
            </span>
          )}
          {meta.min !== undefined && (
            <span className="text-gray">
              도매수량 {meta.min?.toLocaleString()}~{meta.max?.toLocaleString()}
            </span>
          )}
          {rangeWarn && (
            <span className="font-medium text-[#ED1C24]">
              ⚠ 우리 수량({p.minQty.toLocaleString()}~{p.maxQty.toLocaleString()})이 도매 범위를
              벗어남 — 범위 밖 주문은 발주 실패
            </span>
          )}
          <button
            onClick={unlink}
            disabled={busy}
            className="rounded border border-line px-2.5 py-1 text-xs text-gray hover:bg-white disabled:opacity-50"
          >
            해제
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray">도매 미연동 (주문 시 수동 처리)</span>
          {configured && (
            <>
              <input
                value={svcId}
                onChange={(e) => setSvcId(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="서비스 ID"
                className="w-28 rounded border border-line bg-white px-3 py-1.5 text-xs text-navy focus:border-blue focus:outline-none"
              />
              <button
                onClick={link}
                disabled={busy}
                className="rounded bg-blue px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                {busy ? "확인 중..." : "연동"}
              </button>
              <span className="text-xs text-gray">
                ↓ 아래 검색에서 ID를 찾으세요{services.length ? ` (${services.length}개 로드됨)` : ""}
              </span>
            </>
          )}
          {error && <span className="text-xs font-medium text-[#ED1C24]">{error}</span>}
        </div>
      )}
    </div>
  );
}

// ── 도매 서비스 검색 패널 ─────────────────────────────
function ServiceSearch({
  services,
  usdKrw,
}: {
  services: ProviderService[];
  usdKrw: number;
}) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return services
      .filter(
        (s) =>
          String(s.service) === t ||
          s.name.toLowerCase().includes(t) ||
          s.category.toLowerCase().includes(t),
      )
      .slice(0, 12);
  }, [services, q]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-navy">도매 서비스 검색</h2>
        <p className="text-sm text-gray">
          키워드(한국인, followers, 유튜브...)나 서비스 ID로 검색해 상품에 연동할 ID를 찾으세요.
        </p>
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="예: 한국인 팔로워 / youtube views / 4193"
        className="w-full rounded border border-line px-4 py-3 text-sm text-navy focus:border-blue focus:outline-none"
      />
      {q.trim() && (
        <div className="flex flex-col divide-y divide-line overflow-hidden rounded-lg border border-line">
          {results.length === 0 ? (
            <p className="p-4 text-sm text-gray">검색 결과가 없습니다.</p>
          ) : (
            results.map((s) => (
              <div key={s.service} className="flex flex-col gap-0.5 px-4 py-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="shrink-0 rounded bg-navy px-2 py-0.5 text-xs font-semibold text-white">
                    #{s.service}
                  </span>
                  <span className="truncate font-medium text-navy" title={s.name}>
                    {s.name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 text-xs text-gray">
                  <span>{s.category}</span>
                  <span>
                    원가 약{" "}
                    <span className="font-medium text-navy">
                      {((s.rate * usdKrw) / 1000).toFixed(2)}원/개
                    </span>{" "}
                    (${s.rate}/1k)
                  </span>
                  <span>
                    수량 {s.min.toLocaleString()}~{s.max.toLocaleString()}
                  </span>
                  {s.refill && <span className="text-blue">리필</span>}
                  {s.cancel && <span>취소가능</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminProducts({
  products,
  configured,
  services,
  providerBalance,
  providerError,
  usdKrw,
}: {
  products: ProductItem[];
  configured: boolean;
  services: ProviderService[];
  providerBalance: string | null;
  providerError: string | null;
  usdKrw: number;
}) {
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

      {/* 도매 연동 상태 */}
      <div
        className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border p-4 text-sm ${
          configured && !providerError
            ? "border-blue/30 bg-blue/5"
            : "border-line bg-soft"
        }`}
      >
        {!configured ? (
          <span className="text-gray">
            도매 API 미설정 — <code className="rounded bg-white px-1.5">SMM_API_KEY</code> 환경변수
            등록 시 자동 발주가 활성화됩니다. 현재는 모든 주문이 수동 처리 모드입니다.
          </span>
        ) : providerError ? (
          <span className="font-medium text-[#ED1C24]">{providerError}</span>
        ) : (
          <>
            <span className="font-medium text-navy">도매 연동 활성 (realsite.shop)</span>
            <span className="text-gray">
              도매 잔액 <span className="font-semibold text-navy">{providerBalance}</span>
            </span>
            <span className="text-gray">서비스 {services.length.toLocaleString()}개</span>
            <span className="text-gray">환율 {usdKrw.toLocaleString()}원/USD</span>
            {providerBalance === "$0.00" && (
              <span className="font-medium text-orange">
                ⚠ 도매 잔액 0원 — 충전 전까지 발주가 실패합니다
              </span>
            )}
          </>
        )}
      </div>

      {/* 도매 서비스 검색 */}
      {configured && services.length > 0 && (
        <ServiceSearch services={services} usdKrw={usdKrw} />
      )}

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
            <div key={p.id} className="border-b border-line px-6 py-4 last:border-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col">
                  <span className="flex items-center gap-2 font-medium text-navy">
                    {!p.isActive && (
                      <span className="rounded-full bg-soft px-2 py-0.5 text-xs text-gray">
                        비활성
                      </span>
                    )}
                    [{p.category}] {p.name}
                  </span>
                  <span className="text-sm text-gray">누적 주문 {p.orderCount}건</span>
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
              <PriceEditor p={p} usdKrw={usdKrw} />
              <ProviderPanel
                p={p}
                services={services}
                configured={configured}
                usdKrw={usdKrw}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
