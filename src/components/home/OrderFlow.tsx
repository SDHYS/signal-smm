"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Star, UserPlus } from "lucide-react";
import { SiInstagram } from "react-icons/si";
import { platforms } from "./platforms";

function StepHeader({ step, title }: { step: string; title: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-base font-medium text-orange">{step}</p>
      <h2 className="text-[28px] font-bold leading-[38px] text-navy">{title}</h2>
    </div>
  );
}

const categories = ["일반", "팔로워", "연령별 / 성별"];

type Service = { id: number; title: string; tags: string[]; unitPrice: number };
const services: Service[] = [
  { id: 1, title: "한국인 인스타 팔로워", tags: ["일반", "팔로워", "날짜"], unitPrice: 12 },
  { id: 2, title: "인스타그램 게시물 좋아요", tags: ["일반", "팔로워", "날짜"], unitPrice: 8 },
  { id: 3, title: "인스타그램 한국인 댓글", tags: ["일반", "팔로워", "날짜"], unitPrice: 30 },
  { id: 4, title: "인스타그램 동영상 조회수", tags: ["일반", "팔로워", "날짜"], unitPrice: 5 },
  { id: 5, title: "인스타그램 릴스 노출", tags: ["일반", "팔로워", "날짜"], unitPrice: 15 },
  { id: 6, title: "인스타그램 저장수", tags: ["일반", "팔로워", "날짜"], unitPrice: 10 },
];

const detailTabs = ["서비스 설명", "주문 방법", "주의 사항", "FAQ"];

const MIN_QTY = 3;
const MAX_QTY = 100;

export default function OrderFlow() {
  const [platformIdx, setPlatformIdx] = useState(0);
  const [categoryIdx, setCategoryIdx] = useState(0);
  const [serviceId, setServiceId] = useState<number>(services[0].id);
  const [detailTab, setDetailTab] = useState(0);
  const [link, setLink] = useState("");
  const [qty, setQty] = useState("");

  const service = useMemo(
    () => services.find((s) => s.id === serviceId) ?? services[0],
    [serviceId],
  );

  const quantity = Number(qty) || 0;
  const amount = quantity * service.unitPrice;

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
                onClick={() => setPlatformIdx(i)}
                className="flex flex-col items-center gap-3"
              >
                <span
                  className={`flex h-[120px] w-[120px] items-center justify-center rounded-2xl transition ${
                    active
                      ? "bg-white shadow-[4px_4px_6px_rgba(34,34,34,0.30)] outline outline-1 outline-white"
                      : "bg-soft-2 hover:bg-line/60"
                  }`}
                >
                  {p.icon}
                </span>
                <span className="text-center text-lg font-medium text-navy">
                  {p.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* STEP 02 — 서비스 목록 */}
      <section className="flex flex-col gap-7">
        <StepHeader step="STEP 02" title="사용하실 서비스 목록을 선택해 주세요." />

        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#9146FF]">
                <SiInstagram className="text-2xl text-white" />
              </span>
              <span className="text-xl font-medium text-navy">국내서비스</span>
            </div>
            <button className="flex items-center gap-1 rounded bg-soft px-4 py-3 text-sm font-medium text-gray transition hover:text-navy">
              <Star size={18} strokeWidth={1.5} />
              즐겨찾기
            </button>
          </div>

          {/* 카테고리 탭 */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {categories.map((c, i) => {
              const active = i === categoryIdx;
              return (
                <button
                  key={c}
                  onClick={() => setCategoryIdx(i)}
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
            {services.map((s) => {
              const active = s.id === serviceId;
              return (
                <button
                  key={s.id}
                  onClick={() => setServiceId(s.id)}
                  className="flex w-full items-center justify-between gap-4 border-b border-line/70 py-6 text-left last:border-0"
                >
                  <div className="flex flex-col gap-2">
                    <span className="text-lg font-medium text-navy">{s.title}</span>
                    <span className="flex items-center gap-2 text-sm font-normal text-gray">
                      {s.tags.map((t, ti) => (
                        <span key={t} className="flex items-center gap-2">
                          {ti > 0 && <span className="h-1 w-1 rounded-full bg-line" />}
                          {t}
                        </span>
                      ))}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-8 py-3 text-base font-medium transition ${
                      active ? "bg-blue text-white" : "bg-soft text-gray"
                    }`}
                  >
                    {s.unitPrice.toLocaleString()}원
                  </span>
                </button>
              );
            })}
          </div>

          {/* 선택 서비스 설명 */}
          <div className="flex flex-col gap-3 rounded-xl bg-soft p-6">
            <div className="flex items-center gap-1">
              <Star size={22} className="fill-muted text-muted" />
              <span className="text-lg font-medium text-navy">{service.title}</span>
            </div>
            <p className="text-base font-normal leading-[26px] text-gray">
              실제 국내에서 활동하는 인스타그램 사용자가 회원님의 계정을 팔로우하는
              서비스입니다.
            </p>
          </div>
        </div>
      </section>

      {/* STEP 03 — 상세 설명 */}
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
            <DetailBlock title="서비스설명">
              <p className="text-base font-normal leading-[26px] text-gray">
                회원가입 이후 SNS서포터에서 24시간 언제든 원하는 마케팅 상품을 간편하게
                주문하세요. 인스타그램 팔로워 늘리기부터 유튜브, 페이스북까지 다양한
                플랫폼의 맞춤형 마케팅 서비스를 제공하고 있습니다.
              </p>
            </DetailBlock>
            <DetailBlock title="서비스 상세설명">
              <p className="whitespace-pre-line text-base font-normal leading-[26px] text-gray">
                {"• 원하는 댓글을 그대로 전달받아 작성합니다.\n• 하단 주문입력창에 1줄당 1개씩 입력합니다.\n• 댓글 내용에 해시태그, @ 입력시 작업이 불가능합니다.\n• #advertiser 가 붙은 광고 게시물은 작업이 불가합니다."}
              </p>
            </DetailBlock>
            <DetailBlock title="주문링크 기입방법">
              <p className="text-base font-normal leading-[26px] text-gray">
                • 인스타그램 게시물 링크를 입력해주세요.
                <br />
                게시글 우측 상단 [메뉴] 클릭 → 링크복사 버튼 클릭 → 주문링크에 붙여넣은
                후 주문
                <br />
                <span className="text-navy">
                  [링크형식 : https://www.instagram.com/p/xxxxxxxx]
                </span>
              </p>
            </DetailBlock>
            <div className="flex flex-col gap-2">
              <p className="text-lg font-medium text-navy">주문 시작시간</p>
              <p className="text-base font-normal leading-[26px] text-gray">
                평균 5~20분내로 자동으로 작업이 시작됩니다.
              </p>
            </div>
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
            placeholder={`최소 ${MIN_QTY} ~ 최대 ${MAX_QTY}`}
            className="w-full rounded-lg border border-line bg-white px-6 py-7 text-lg font-normal text-navy placeholder:text-gray focus:border-blue focus:outline-none"
          />
          <p className="text-sm font-normal text-navy">
            최소 주문가능 수량: {MIN_QTY} - 최대 주문가능 수량: {MAX_QTY}
          </p>
        </div>
      </section>

      {/* STEP 06 — 주문금액 */}
      <section className="flex flex-col gap-7">
        <StepHeader step="STEP 06" title="주문금액" />
        <div className="w-full rounded-lg border border-line bg-white px-6 py-7 text-lg font-normal text-navy">
          ₩{amount.toLocaleString()}
        </div>
      </section>

      {/* 주문하기 */}
      <div className="flex flex-col gap-5">
        <button className="flex items-center justify-center rounded-lg bg-gradient-to-r from-[#E97C5E] via-[#EF552B] to-[#C23610] px-10 py-8 text-2xl font-medium text-white shadow-[12px_12px_24px_rgba(255,141,110,0.6)] transition-transform hover:-translate-y-0.5">
          주문하기
        </button>
        <p className="text-sm font-normal text-navy">
          최소 주문가능 수량: 10 - 최대 주문가능 수량: 25000
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
