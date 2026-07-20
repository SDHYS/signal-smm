"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Star, UserPlus, X } from "lucide-react";
import { SiInstagram } from "react-icons/si";
import { platforms } from "./platforms";
import { createOrder } from "@/app/actions/order";
import { toggleFavorite } from "@/app/actions/favorite";

const FAV_IDX = platforms.findIndex((p) => p.name === "즐겨찾기");

export type OrderProduct = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  unitPrice: number;
  minQty: number;
  maxQty: number;
  providerServiceId: number | null; // null = 도매 미연동 → 직접 주문 불가(1:1 문의 유도)
};

function StepHeader({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-base font-medium text-orange">{step}</p>
      <h2 className="text-xl font-bold leading-7 sm:text-[26px] sm:leading-9 lg:text-[28px] lg:leading-[38px] text-navy">{title}</h2>
    </div>
  );
}

// 모든 상품을 보여주는 메타 카테고리 타일
const META_TILES = new Set([
  "국내서비스",
  "해외서비스",
  "상위노출",
  "관리서비스",
  "즐겨찾기",
]);

export default function OrderFlow({
  isLoggedIn,
  balance,
  products,
  query,
  favoriteIds,
  copy,
  enforceMapping = false,
}: {
  isLoggedIn: boolean;
  balance: number;
  products: OrderProduct[];
  query?: string;
  favoriteIds: string[];
  copy: Record<string, string>;
  enforceMapping?: boolean; // 실발주 활성 시 도매 미연동 상품을 1:1 문의로 유도
}) {
  const router = useRouter();
  const [platformIdx, setPlatformIdx] = useState(-1);
  const [favs, setFavs] = useState<Set<string>>(() => new Set(favoriteIds));
  const [categoryIdx, setCategoryIdx] = useState(0);
  const [serviceId, setServiceId] = useState<string>("");
  const [detailTab, setDetailTab] = useState(0);
  const [link, setLink] = useState("");
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 리렌더 전 더블클릭(따닥) 차단 + 서버 멱등성 키
  const inFlightRef = useRef(false);
  const orderKeyRef = useRef<string | null>(null);

  // 필터/탭 라벨은 어드민 문구에서 (동작은 인덱스 기반이라 라벨 변경에 안전)
  const categories = [copy.category1, copy.category2, copy.category3];
  const detailTabs = [copy.dtab1, copy.dtab2, copy.dtab3, copy.dtab4];

  const selectedPlatform = platformIdx >= 0 ? platforms[platformIdx] : null;

  // 검색어 → 플랫폼 → 카테고리 순으로 필터
  const filtered = useMemo(() => {
    let list = products;
    if (query?.trim()) {
      const q = query.trim();
      list = list.filter((p) => p.name.includes(q) || p.category.includes(q));
    }
    if (selectedPlatform?.name === "즐겨찾기") {
      list = list.filter((p) => favs.has(p.id));
    } else if (selectedPlatform && !META_TILES.has(selectedPlatform.name)) {
      list = list.filter((p) => p.category === selectedPlatform.name);
    }
    if (categoryIdx === 1) list = list.filter((p) => p.name.includes("팔로워"));
    if (categoryIdx === 2)
      list = list.filter((p) => /연령|성별/.test(p.name));
    return list;
  }, [products, query, selectedPlatform, categoryIdx, favs]);

  async function handleToggleFav(productId: string) {
    if (!isLoggedIn) {
      alert("로그인 후 즐겨찾기를 사용할 수 있습니다.");
      return;
    }
    // 낙관적 업데이트 후 서버 반영
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
    const res = await toggleFavorite(productId);
    if (!res.ok) {
      setFavs((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      });
      alert(res.error ?? "즐겨찾기 처리에 실패했습니다.");
    }
  }

  // 선택 상품: 목록에서 사라지면 자동으로 첫 상품으로 폴백
  const product = useMemo(
    () => filtered.find((p) => p.id === serviceId) ?? filtered[0] ?? null,
    [filtered, serviceId],
  );

  const minQty = product?.minQty ?? 1;
  const maxQty = product?.maxQty ?? 100000;
  const quantity = Number(qty) || 0;
  const amount = quantity * (product?.unitPrice ?? 0);

  const step02Label = selectedPlatform?.name ?? "전체 서비스";

  // 판매 상품이 없는 실제 플랫폼(도매 조달 불가 등) → 주문 UI 대신 1:1 문의 유도.
  // 서버(createOrder)는 실존·활성 상품만 허용하므로 이 분기는 안내용이며,
  // 관리자가 해당 카테고리 상품을 활성화하면 자동으로 일반 주문 모드로 전환된다.
  const inquiryOnly =
    !!selectedPlatform &&
    !META_TILES.has(selectedPlatform.name) &&
    !products.some((p) => p.category === selectedPlatform.name);

  // 선택 상품이 도매 미연동(자동 발주 불가) → 직접 주문 대신 1:1 문의로 안내.
  // 서버(createOrder)도 동일하게 차단하므로 UI는 안내용.
  const productUnavailable =
    enforceMapping && !!product && product.providerServiceId == null;

  async function handleOrder() {
    setError(null);
    if (!isLoggedIn) return setError("로그인 후 주문할 수 있습니다.");
    if (!product) return setError("서비스를 선택해주세요.");
    if (productUnavailable)
      return setError("이 상품은 1:1 문의로 접수해 주세요.");
    if (!link.trim()) return setError("주문 링크를 입력해주세요.");
    if (quantity < minQty || quantity > maxQty)
      return setError(`수량은 ${minQty} ~ ${maxQty} 사이로 입력해주세요.`);
    if (amount > balance)
      return setError("잔액이 부족합니다. 잔액충전 후 이용해주세요.");

    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (!orderKeyRef.current) orderKeyRef.current = crypto.randomUUID();

    setLoading(true);
    try {
      const res = await createOrder({
        productId: product.id,
        quantity,
        targetUrl: link,
        clientKey: orderKeyRef.current,
      });
      if (res.ok) {
        orderKeyRef.current = null;
        router.push("/orders");
        router.refresh();
      } else {
        setError(res.error ?? "주문에 실패했습니다.");
      }
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-24">
      {/* STEP 01 — 플랫폼 선택 */}
      <section className="flex flex-col gap-7">
        <StepHeader step="STEP 01" title={copy.step01_title} />
        <div className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-5 sm:gap-x-4 sm:gap-y-7 lg:grid-cols-7 xl:grid-cols-9">
          {platforms.map((p, i) => {
            const active = i === platformIdx;
            return (
              <button
                key={p.name}
                onClick={() => {
                  setPlatformIdx(active ? -1 : i); // 재클릭 시 선택 해제
                  setServiceId("");
                }}
                className="group flex flex-col items-center gap-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.def}
                  alt={p.name}
                  className={`h-24 w-24 object-contain sm:h-[120px] sm:w-[120px] ${
                    active ? "hidden" : "block group-hover:hidden"
                  }`}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.hover}
                  alt=""
                  aria-hidden
                  className={`h-24 w-24 object-contain sm:h-[120px] sm:w-[120px] ${
                    active ? "block" : "hidden group-hover:block"
                  }`}
                />
                <span
                  className={`text-center text-sm font-medium sm:text-lg ${
                    active ? "text-blue" : "text-navy"
                  }`}
                >
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* STEP 02 — 서비스 목록 */}
      <section id="step02" className="flex flex-col gap-7 scroll-mt-6">
        <StepHeader step="STEP 02" title={copy.step02_title} />

        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedPlatform ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedPlatform.hover}
                  alt={selectedPlatform.name}
                  className="h-[52px] w-[52px] rounded-full object-contain"
                />
              ) : (
                <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#9146FF]">
                  <SiInstagram className="text-2xl text-white" />
                </span>
              )}
              <span className="text-xl font-medium text-navy">{step02Label}</span>
              {query?.trim() && (
                <Link
                  href="/"
                  className="ml-2 flex items-center gap-1 rounded-full bg-soft px-3 py-1.5 text-sm font-medium text-gray transition hover:text-navy"
                >
                  검색: {query} <X size={14} strokeWidth={2} />
                </Link>
              )}
            </div>
            <button
              onClick={() => {
                setPlatformIdx(platformIdx === FAV_IDX ? -1 : FAV_IDX);
                setServiceId("");
              }}
              className={`flex items-center gap-1 rounded px-4 py-3 text-sm font-medium transition ${
                platformIdx === FAV_IDX
                  ? "bg-[#FFC833]/20 text-navy"
                  : "bg-soft text-gray hover:text-navy"
              }`}
            >
              <Star
                size={18}
                strokeWidth={1.5}
                className={platformIdx === FAV_IDX ? "fill-[#FFC833] text-[#FFC833]" : ""}
              />
              즐겨찾기
            </button>
          </div>

          {inquiryOnly && selectedPlatform ? (
            /* 문의 전용 플랫폼 — 주문 불가 안내 */
            <div className="flex flex-col items-start gap-5 rounded-2xl bg-soft p-8 sm:p-10">
              <div className="flex flex-col gap-2">
                <p className="text-lg font-semibold text-navy">
                  {copy.inquiry_only_title.replaceAll("{플랫폼}", selectedPlatform.name)}
                </p>
                <p className="whitespace-pre-line text-base font-normal leading-[26px] text-gray">
                  {copy.inquiry_only_desc}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/inquiry/write"
                  className="rounded-lg bg-orange px-8 py-4 text-base font-medium text-white transition hover:brightness-95"
                >
                  1:1 문의하기
                </Link>
                <Link
                  href="/support"
                  className="rounded-lg bg-white px-8 py-4 text-base font-medium text-gray outline outline-1 outline-line transition hover:text-navy"
                >
                  고객센터
                </Link>
              </div>
            </div>
          ) : (
            <>
          {/* 카테고리 탭 — 상품명 기준 필터 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {categories.map((c, i) => {
              const active = i === categoryIdx;
              return (
                <button
                  key={c}
                  onClick={() => {
                    setCategoryIdx(i);
                    setServiceId("");
                  }}
                  className={`flex items-center justify-between rounded-lg px-4 py-5 transition ${
                    active
                      ? "outline outline-1 outline-blue"
                      : "outline outline-1 outline-line/80 hover:outline-line"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <UserPlus size={24} strokeWidth={1.5} className="text-navy" />
                    <span className="text-base font-medium text-navy">{c}</span>
                  </span>
                  <ChevronRight size={20} strokeWidth={1.5} className="text-gray-2" />
                </button>
              );
            })}
          </div>

          {/* 서비스 리스트 */}
          <div className="thin-scrollbar max-h-[420px] overflow-y-auto pr-2">
            {filtered.length === 0 && (
              <p className="py-6 text-base text-gray">
                {selectedPlatform?.name === "즐겨찾기"
                  ? "즐겨찾기한 상품이 없습니다. 상품 옆 별 아이콘으로 추가해보세요."
                  : selectedPlatform && !META_TILES.has(selectedPlatform.name)
                    ? `${selectedPlatform.name} 상품은 준비 중입니다. 다른 플랫폼을 선택해주세요.`
                    : "조건에 맞는 상품이 없습니다."}
              </p>
            )}
            {filtered.map((p) => {
              const active = p.id === product?.id;
              const isFav = favs.has(p.id);
              return (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={active}
                  aria-label={`${p.name} 선택`}
                  onClick={() => setServiceId(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setServiceId(p.id);
                    }
                  }}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 border-b border-line/70 py-6 text-left last:border-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue"
                >
                  <div className="flex items-center gap-3">
                    <button
                      aria-label={isFav ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFav(p.id);
                      }}
                      className="shrink-0 transition hover:scale-110"
                    >
                      <Star
                        size={22}
                        strokeWidth={1.5}
                        className={isFav ? "fill-[#FFC833] text-[#FFC833]" : "text-muted"}
                      />
                    </button>
                    <div className="flex flex-col gap-2">
                      <span className="text-lg font-medium text-navy">{p.name}</span>
                      <span className="text-sm font-normal text-gray">{p.category}</span>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-8 py-3 text-base font-medium transition ${
                      active ? "bg-blue text-white" : "bg-soft text-gray"
                    }`}
                  >
                    {p.unitPrice.toLocaleString()}원
                  </span>
                </div>
              );
            })}
          </div>

          {/* 선택 서비스 설명 */}
          {product && (
            <div className="flex flex-col gap-3 rounded-xl bg-soft p-6">
              <div className="flex items-center gap-1">
                <Star size={22} className="fill-muted text-muted" />
                <span className="text-lg font-medium text-navy">{product.name}</span>
              </div>
              <p className="text-base font-normal leading-[26px] text-gray">
                {product.description ??
                  "실제 국내에서 활동하는 사용자가 자연스럽게 반영되는 서비스입니다."}
              </p>
            </div>
          )}
            </>
          )}
        </div>
      </section>

      {/* 도매 미연동 상품 선택 시 — 주문 폼 대신 1:1 문의 안내 */}
      {!inquiryOnly && productUnavailable && (
        <section className="flex flex-col gap-5 rounded-2xl bg-orange/5 p-8 sm:p-10">
          <div className="flex flex-col gap-2">
            <p className="text-lg font-semibold text-navy">이 상품은 1:1 문의로 접수해 주세요</p>
            <p className="text-base font-normal leading-[26px] text-gray">
              선택하신 &laquo;{product?.name}&raquo; 은(는) 현재 자동 주문이 지원되지 않는 상품입니다.
              1:1 문의를 남겨주시면 담당자가 확인 후 안내해 드립니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/inquiry/write"
              className="rounded-lg bg-orange px-8 py-4 text-base font-medium text-white transition hover:brightness-95"
            >
              1:1 문의하기
            </Link>
            <Link
              href="/support"
              className="rounded-lg bg-white px-8 py-4 text-base font-medium text-gray outline outline-1 outline-line transition hover:text-navy"
            >
              고객센터
            </Link>
          </div>
        </section>
      )}

      {!inquiryOnly && !productUnavailable && (
        <>
      {/* STEP 03 — 상세 설명 (탭별 내용) */}
      <section className="flex flex-col gap-7">
        <StepHeader step="STEP 03" title={copy.step03_title} />
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {detailTabs.map((t, i) => {
              const active = i === detailTab;
              return (
                <button
                  key={t}
                  onClick={() => setDetailTab(i)}
                  className={`rounded-full px-6 py-3 text-sm font-medium transition ${
                    active ? "bg-blue text-white" : "bg-white text-gray-2 hover:bg-soft"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-10 rounded-2xl bg-soft p-10">
            {detailTab === 0 && (
              <>
                <DetailBlock title="서비스설명">
                  <p className="whitespace-pre-line text-base font-normal leading-[26px] text-gray">
                    {copy.detail_service_desc}
                  </p>
                </DetailBlock>
                {product && (
                  <DetailBlock title={`선택 상품 — ${product.name}`}>
                    <p className="text-base font-normal leading-[26px] text-gray">
                      {product.description ??
                        "실제 활동 사용자가 자연스럽게 반영되는 서비스입니다."}
                      <br />
                      단가 {product.unitPrice.toLocaleString()}원 · 최소{" "}
                      {product.minQty.toLocaleString()} ~ 최대{" "}
                      {product.maxQty.toLocaleString()}개
                    </p>
                  </DetailBlock>
                )}
              </>
            )}

            {detailTab === 1 && (
              <>
                <DetailBlock title="주문링크 기입방법">
                  <p className="whitespace-pre-line text-base font-normal leading-[26px] text-gray">
                    {copy.detail_link_guide}
                  </p>
                </DetailBlock>
                <DetailBlock title="주문 순서">
                  <p className="whitespace-pre-line text-base font-normal leading-[26px] text-gray">
                    {copy.detail_order_steps}
                  </p>
                </DetailBlock>
                <div className="flex flex-col gap-2">
                  <p className="text-lg font-medium text-navy">주문 시작시간</p>
                  <p className="text-base font-normal leading-[26px] text-gray">
                    {copy.detail_start_time}
                  </p>
                </div>
              </>
            )}

            {detailTab === 2 && (
              <DetailBlock title="주의 사항">
                <p className="whitespace-pre-line text-base font-normal leading-[26px] text-gray">
                  {copy.detail_caution}
                </p>
              </DetailBlock>
            )}

            {detailTab === 3 && (
              <>
                <DetailBlock title={copy.detail_faq1_q}>
                  <p className="whitespace-pre-line text-base font-normal leading-[26px] text-gray">
                    {copy.detail_faq1_a}
                  </p>
                </DetailBlock>
                <DetailBlock title={copy.detail_faq2_q}>
                  <p className="whitespace-pre-line text-base font-normal leading-[26px] text-gray">
                    {copy.detail_faq2_a}
                  </p>
                </DetailBlock>
                <DetailBlock title={copy.detail_faq3_q}>
                  <p className="whitespace-pre-line text-base font-normal leading-[26px] text-gray">
                    {copy.detail_faq3_a}
                  </p>
                </DetailBlock>
              </>
            )}
          </div>
        </div>
      </section>

      {/* STEP 04 — 주문 링크 */}
      <section className="flex flex-col gap-7">
        <StepHeader step="STEP 04" title={copy.step04_title} />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="게시물 링크를 입력해주세요"
          aria-label="주문 링크"
          className="w-full rounded-lg border border-line bg-white px-5 py-4 text-base font-normal sm:px-6 sm:py-7 sm:text-lg text-navy placeholder:text-gray focus:border-blue focus:outline-none"
        />
      </section>

      {/* STEP 05 — 수량 */}
      <section className="flex flex-col gap-7">
        <StepHeader step="STEP 05" title={copy.step05_title} />
        <div className="flex flex-col gap-3">
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            placeholder={`최소 ${minQty} ~ 최대 ${maxQty}`}
            className="w-full rounded-lg border border-line bg-white px-5 py-4 text-base font-normal sm:px-6 sm:py-7 sm:text-lg text-navy placeholder:text-gray focus:border-blue focus:outline-none"
          />
          <p className="text-sm font-normal text-navy">
            최소 주문가능 수량: {minQty.toLocaleString()} - 최대 주문가능 수량:{" "}
            {maxQty.toLocaleString()}
          </p>
        </div>
      </section>

      {/* STEP 06 — 주문금액 */}
      <section className="flex flex-col gap-7">
        <StepHeader step="STEP 06" title={copy.step06_title} />
        <div className="flex flex-col items-start gap-1 rounded-lg border border-line bg-white px-5 py-4 text-base font-normal text-navy sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-7 sm:text-lg">
          <span>₩{amount.toLocaleString()}</span>
          <span className="text-sm text-gray">
            보유잔액 ₩{balance.toLocaleString()}
          </span>
        </div>
      </section>

      {/* 주문하기 */}
      <div className="flex flex-col gap-5">
        {error && <p role="alert" className="text-sm font-medium text-[#ED1C24]">{error}</p>}
        <button
          onClick={handleOrder}
          disabled={loading}
          className="flex items-center justify-center rounded-lg bg-gradient-to-r from-[#E97C5E] via-[#EF552B] to-[#C23610] px-6 py-5 text-lg font-medium sm:px-10 sm:py-8 sm:text-2xl text-white shadow-[12px_12px_24px_rgba(255,141,110,0.6)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {loading ? "주문 중..." : "주문하기"}
        </button>
        <p className="text-sm font-normal text-navy">
          {copy.order_footnote}
        </p>
      </div>
        </>
      )}
    </div>
  );
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1">
        <Star size={22} className="fill-muted text-muted" />
        <span className="text-lg font-medium text-navy">{title}</span>
      </div>
      {children}
    </div>
  );
}
