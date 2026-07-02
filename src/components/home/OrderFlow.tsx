"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Star, UserPlus, X } from "lucide-react";
import { SiInstagram } from "react-icons/si";
import { platforms } from "./platforms";
import { createOrder } from "@/app/actions/order";

export type OrderProduct = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  unitPrice: number;
  minQty: number;
  maxQty: number;
};

function StepHeader({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-base font-medium text-orange">{step}</p>
      <h2 className="text-[28px] font-bold leading-[38px] text-navy">{title}</h2>
    </div>
  );
}

const categories = ["일반", "팔로워", "연령별 / 성별"];
const detailTabs = ["서비스 설명", "주문 방법", "주의 사항", "FAQ"];

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
}: {
  isLoggedIn: boolean;
  balance: number;
  products: OrderProduct[];
  query?: string;
}) {
  const router = useRouter();
  const [platformIdx, setPlatformIdx] = useState(-1);
  const [categoryIdx, setCategoryIdx] = useState(0);
  const [serviceId, setServiceId] = useState<string>("");
  const [detailTab, setDetailTab] = useState(0);
  const [link, setLink] = useState("");
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlatform = platformIdx >= 0 ? platforms[platformIdx] : null;

  // 검색어 → 플랫폼 → 카테고리 순으로 필터
  const filtered = useMemo(() => {
    let list = products;
    if (query?.trim()) {
      const q = query.trim();
      list = list.filter((p) => p.name.includes(q) || p.category.includes(q));
    }
    if (selectedPlatform && !META_TILES.has(selectedPlatform.name)) {
      list = list.filter((p) => p.category === selectedPlatform.name);
    }
    if (categoryIdx === 1) list = list.filter((p) => p.name.includes("팔로워"));
    if (categoryIdx === 2)
      list = list.filter((p) => /연령|성별/.test(p.name));
    return list;
  }, [products, query, selectedPlatform, categoryIdx]);

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

  async function handleOrder() {
    setError(null);
    if (!isLoggedIn) return setError("로그인 후 주문할 수 있습니다.");
    if (!product) return setError("서비스를 선택해주세요.");
    if (!link.trim()) return setError("주문 링크를 입력해주세요.");
    if (quantity < minQty || quantity > maxQty)
      return setError(`수량은 ${minQty} ~ ${maxQty} 사이로 입력해주세요.`);
    if (amount > balance)
      return setError("잔액이 부족합니다. 잔액충전 후 이용해주세요.");

    setLoading(true);
    const res = await createOrder({
      productId: product.id,
      quantity,
      targetUrl: link,
    });
    setLoading(false);
    if (res.ok) {
      router.push("/orders");
      router.refresh();
    } else {
      setError(res.error ?? "주문에 실패했습니다.");
    }
  }

  return (
    <div className="flex flex-col gap-24">
      {/* STEP 01 — 플랫폼 선택 */}
      <section className="flex flex-col gap-7">
        <StepHeader step="STEP 01" title="이용하실 SNS 플랫폼을 선택해 주세요." />
        <div className="grid grid-cols-3 gap-x-4 gap-y-7 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9">
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
                  className={`h-[120px] w-[120px] object-contain ${
                    active ? "hidden" : "block group-hover:hidden"
                  }`}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.hover}
                  alt=""
                  aria-hidden
                  className={`h-[120px] w-[120px] object-contain ${
                    active ? "block" : "hidden group-hover:block"
                  }`}
                />
                <span
                  className={`text-center text-lg font-medium ${
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
        <StepHeader step="STEP 02" title="사용하실 서비스 목록을 선택해 주세요." />

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
              onClick={() => alert("즐겨찾기 기능은 준비 중입니다.")}
              className="flex items-center gap-1 rounded bg-soft px-4 py-3 text-sm font-medium text-gray transition hover:text-navy"
            >
              <Star size={18} strokeWidth={1.5} />
              즐겨찾기
            </button>
          </div>

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
                {selectedPlatform && !META_TILES.has(selectedPlatform.name)
                  ? `${selectedPlatform.name} 상품은 준비 중입니다. 다른 플랫폼을 선택해주세요.`
                  : "조건에 맞는 상품이 없습니다."}
              </p>
            )}
            {filtered.map((p) => {
              const active = p.id === product?.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setServiceId(p.id)}
                  className="flex w-full items-center justify-between gap-4 border-b border-line/70 py-6 text-left last:border-0"
                >
                  <div className="flex flex-col gap-2">
                    <span className="text-lg font-medium text-navy">{p.name}</span>
                    <span className="text-sm font-normal text-gray">{p.category}</span>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-8 py-3 text-base font-medium transition ${
                      active ? "bg-blue text-white" : "bg-soft text-gray"
                    }`}
                  >
                    {p.unitPrice.toLocaleString()}원
                  </span>
                </button>
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
        </div>
      </section>

      {/* STEP 03 — 상세 설명 (탭별 내용) */}
      <section className="flex flex-col gap-7">
        <StepHeader step="STEP 03" title="해당 상품에 대한 상세 설명 입니다." />
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
                  <p className="text-base font-normal leading-[26px] text-gray">
                    회원가입 이후 24시간 언제든 원하는 마케팅 상품을 간편하게 주문하세요.
                    인스타그램 팔로워 늘리기부터 유튜브, 틱톡까지 다양한 플랫폼의 맞춤형
                    마케팅 서비스를 제공하고 있습니다.
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
                  <p className="text-base font-normal leading-[26px] text-gray">
                    • 인스타그램 게시물 링크를 입력해주세요.
                    <br />
                    게시글 우측 상단 [메뉴] 클릭 → 링크복사 → 주문링크에 붙여넣은 후 주문
                    <br />
                    <span className="text-navy">
                      [링크형식 : https://www.instagram.com/p/xxxxxxxx]
                    </span>
                  </p>
                </DetailBlock>
                <DetailBlock title="주문 순서">
                  <p className="whitespace-pre-line text-base font-normal leading-[26px] text-gray">
                    {"1. 플랫폼 선택 → 서비스 선택\n2. 주문 링크·수량 입력\n3. 주문금액 확인 후 [주문하기] — 보유잔액에서 즉시 차감됩니다.\n4. 주문내역에서 진행 상태를 확인하세요."}
                  </p>
                </DetailBlock>
                <div className="flex flex-col gap-2">
                  <p className="text-lg font-medium text-navy">주문 시작시간</p>
                  <p className="text-base font-normal leading-[26px] text-gray">
                    평균 5~20분내로 자동으로 작업이 시작됩니다.
                  </p>
                </div>
              </>
            )}

            {detailTab === 2 && (
              <DetailBlock title="주의 사항">
                <p className="whitespace-pre-line text-base font-normal leading-[26px] text-gray">
                  {"• 비공개 계정은 작업이 불가능합니다. 주문 전 공개 상태로 전환해주세요.\n• 작업 중 계정·게시물을 삭제하거나 비공개로 전환하면 처리가 불가하며 환불되지 않습니다.\n• 동일 링크는 이전 주문이 완료된 후 재주문해주세요. 중복 주문 시 누락될 수 있습니다.\n• 링크를 잘못 입력해 진행된 주문은 취소·환불이 어렵습니다."}
                </p>
              </DetailBlock>
            )}

            {detailTab === 3 && (
              <>
                <DetailBlock title="Q. 주문 후 언제 시작되나요?">
                  <p className="text-base font-normal leading-[26px] text-gray">
                    평균 5~20분 내 자동으로 시작되며, 서비스에 따라 최대 몇 시간이 걸릴 수
                    있습니다.
                  </p>
                </DetailBlock>
                <DetailBlock title="Q. 주문을 취소할 수 있나요?">
                  <p className="text-base font-normal leading-[26px] text-gray">
                    작업 시작 전이라면 1:1 문의로 요청해주세요. 관리자가 환불 처리하면 결제
                    금액이 잔액으로 복구됩니다.
                  </p>
                </DetailBlock>
                <DetailBlock title="Q. 수량이 다 안 들어오면 어떻게 되나요?">
                  <p className="text-base font-normal leading-[26px] text-gray">
                    미완료 수량은 확인 후 잔액으로 환불 처리해드립니다. 1:1 문의로 남겨주세요.
                  </p>
                </DetailBlock>
              </>
            )}
          </div>
        </div>
      </section>

      {/* STEP 04 — 주문 링크 */}
      <section className="flex flex-col gap-7">
        <StepHeader step="STEP 04" title="주문 링크를 입력해주세요." />
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="게시물 링크를 입력해주세요"
          className="w-full rounded-lg border border-line bg-white px-6 py-7 text-lg font-normal text-navy placeholder:text-gray focus:border-blue focus:outline-none"
        />
      </section>

      {/* STEP 05 — 수량 */}
      <section className="flex flex-col gap-7">
        <StepHeader step="STEP 05" title="구매 수량을 입력해주세요." />
        <div className="flex flex-col gap-3">
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            placeholder={`최소 ${minQty} ~ 최대 ${maxQty}`}
            className="w-full rounded-lg border border-line bg-white px-6 py-7 text-lg font-normal text-navy placeholder:text-gray focus:border-blue focus:outline-none"
          />
          <p className="text-sm font-normal text-navy">
            최소 주문가능 수량: {minQty.toLocaleString()} - 최대 주문가능 수량:{" "}
            {maxQty.toLocaleString()}
          </p>
        </div>
      </section>

      {/* STEP 06 — 주문금액 */}
      <section className="flex flex-col gap-7">
        <StepHeader step="STEP 06" title="주문금액" />
        <div className="flex items-center justify-between rounded-lg border border-line bg-white px-6 py-7 text-lg font-normal text-navy">
          <span>₩{amount.toLocaleString()}</span>
          <span className="text-sm text-gray">
            보유잔액 ₩{balance.toLocaleString()}
          </span>
        </div>
      </section>

      {/* 주문하기 */}
      <div className="flex flex-col gap-5">
        {error && <p className="text-sm font-medium text-[#ED1C24]">{error}</p>}
        <button
          onClick={handleOrder}
          disabled={loading}
          className="flex items-center justify-center rounded-lg bg-gradient-to-r from-[#E97C5E] via-[#EF552B] to-[#C23610] px-10 py-8 text-2xl font-medium text-white shadow-[12px_12px_24px_rgba(255,141,110,0.6)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {loading ? "주문 중..." : "주문하기"}
        </button>
        <p className="text-sm font-normal text-navy">
          주문 시 보유잔액에서 즉시 차감됩니다.
        </p>
      </div>
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
