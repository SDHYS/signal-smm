"use client";

import { useId, useRef, useState } from "react";
import { fmtKSTDate } from "@/lib/datetime";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createChargeRequest, cancelMyCharge } from "@/app/actions/charge";

type Bank = { bankName: string; account: string; holder: string };
type ChargeStatus = "PENDING" | "CONFIRMED" | "CANCELLED";
type History = {
  id: string;
  amount: number;
  total: number;
  depositorName: string;
  status: ChargeStatus;
  createdAt: string;
};

// 프리셋 라벨: 만원 단위는 'N만원', 그 외는 원 단위 표기
function presetLabel(v: number) {
  return v % 10000 === 0 ? `+ ${v / 10000}만원` : `+ ${v.toLocaleString()}원`;
}

const receiptOptions = ["신청안함", "세금계산서", "현금영수증"];

const statusMeta: Record<ChargeStatus, { label: string; cls: string }> = {
  PENDING: { label: "입금대기", cls: "bg-orange/10 text-orange" },
  CONFIRMED: { label: "충전완료", cls: "bg-blue/10 text-blue" },
  CANCELLED: { label: "취소", cls: "bg-soft text-gray" },
};

const won = (n: number) => `${n.toLocaleString()}원`;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold leading-7 sm:text-[26px] sm:leading-9 lg:text-[28px] lg:leading-[38px] text-navy">{children}</h2>;
}

function LabeledInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-1 flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-[#222222]">{label}</label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-line px-4 py-5 text-sm text-navy placeholder:text-gray focus:border-blue focus:outline-none"
      />
    </div>
  );
}

export default function ChargePage({
  isLoggedIn,
  balance,
  bank,
  history,
  copy,
  presets,
  vatRate,
}: {
  isLoggedIn: boolean;
  balance: number;
  bank: Bank;
  history: History[];
  copy: Record<string, string>;
  presets: number[];
  vatRate: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(0);
  const [depositor, setDepositor] = useState("");
  const [receipt, setReceipt] = useState(0);

  const [companyName, setCompanyName] = useState("");
  const [bizNo, setBizNo] = useState("");
  const [ceo, setCeo] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [taxEmail, setTaxEmail] = useState("");
  const [cashReceiptNo, setCashReceiptNo] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ total: number; depositor: string } | null>(null);
  // 리렌더 전 따닥 차단 + 서버 멱등성 키 (한 번의 신청은 한 건만)
  const inFlightRef = useRef(false);
  const chargeKeyRef = useRef<string | null>(null);

  const vat = Math.round((amount * vatRate) / 100);
  const total = amount + vat;

  async function handleSubmit() {
    setError(null);
    setDone(null);
    if (!isLoggedIn) {
      setError("로그인 후 충전할 수 있습니다.");
      return;
    }
    if (amount <= 0) {
      setError("충전 금액을 선택해주세요.");
      return;
    }
    if (!depositor.trim()) {
      setError("입금자명을 작성해주세요.");
      return;
    }
    // 영수증 상세 수집
    const receiptDetail: Record<string, string> | undefined =
      receipt === 1
        ? {
            회사명: companyName,
            사업자등록번호: bizNo,
            대표자: ceo,
            담당자연락처: managerPhone,
            이메일: taxEmail,
          }
        : receipt === 2
          ? { 휴대폰번호: cashReceiptNo }
          : undefined;

    if (inFlightRef.current) return;
    inFlightRef.current = true;
    if (!chargeKeyRef.current) chargeKeyRef.current = crypto.randomUUID();

    setLoading(true);
    try {
      const res = await createChargeRequest({
        amount,
        depositorName: depositor,
        receiptType: receiptOptions[receipt],
        receiptDetail,
        clientKey: chargeKeyRef.current,
      });
      if (res.ok) {
        chargeKeyRef.current = null; // 성공 → 다음 신청은 새 키
        // 서버가 저장한 total 을 표시(부가세율 변경 레이스 시에도 표시=저장 일치)
        setDone({ total: res.total ?? total, depositor: depositor.trim() });
        setAmount(0);
        setDepositor("");
        router.refresh();
      } else {
        setError(res.error ?? "충전 신청에 실패했습니다.");
      }
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-12 pt-2">
      {/* 헤더 */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2.5">
          <p className="text-base font-normal text-[#767676]">{copy.charge_eyebrow}</p>
          <h1 className="text-[26px] font-bold leading-9 sm:text-[34px] sm:leading-[46px] lg:text-[40px] lg:leading-[52px] text-black">{copy.charge_title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue px-6 py-3 text-sm font-medium text-white">
            무통장 입금
          </span>
        </div>
      </div>

      {!isLoggedIn && (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-soft px-6 py-5">
          <span className="text-base font-medium text-navy">
            충전은 로그인 후 이용할 수 있습니다.
          </span>
          <Link href="/login" className="shrink-0 whitespace-nowrap rounded-lg bg-blue px-6 py-3 text-sm font-medium text-white">
            로그인
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-16">
        {/* 충전 금액 선택 */}
        <section className="flex flex-col gap-8">
          <SectionTitle>충전 금액 선택</SectionTitle>
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount((a) => a + p)}
                  className="rounded border border-line px-3 py-4 text-base font-medium text-navy transition hover:border-blue hover:text-blue sm:px-4 sm:py-6 sm:text-lg"
                >
                  {presetLabel(p)}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-end justify-between rounded-[10px] bg-soft p-10">
                <div className="flex flex-col gap-4">
                  <span className="text-lg font-normal leading-[26px] text-gray">충전후 잔액</span>
                  <div className="flex items-end gap-2">
                    <span className="text-[26px] font-semibold leading-7 text-navy">
                      {won(balance + amount)}
                    </span>
                    {amount > 0 && (
                      <span className="text-base font-normal text-[#04B014]">
                        +{amount.toLocaleString()}원 충전
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAmount(0)}
                className="self-start text-base font-normal text-gray underline"
              >
                금액 초기화
              </button>
            </div>
          </div>
        </section>

        {/* 입금자명 */}
        <section className="flex flex-col gap-8">
          <SectionTitle>입금자명 작성</SectionTitle>
          <div className="flex flex-col gap-3">
            <input
              value={depositor}
              onChange={(e) => setDepositor(e.target.value)}
              placeholder="입금자명을 작성해주세요"
              aria-label="입금자명"
              className="w-full rounded-lg border border-line bg-white px-5 py-4 text-base font-normal sm:px-6 sm:py-7 sm:text-lg text-navy placeholder:text-gray focus:border-blue focus:outline-none"
            />
            <p className="whitespace-pre-line text-sm font-normal leading-6 text-navy">
              {copy.charge_depositor_note}
            </p>
          </div>
        </section>

        {/* 계산서 및 영수증 */}
        <section className="flex flex-col gap-8">
          <SectionTitle>계산서 및 영수증</SectionTitle>
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              {receiptOptions.map((r, i) => {
                const active = i === receipt;
                return (
                  <button
                    key={r}
                    onClick={() => setReceipt(i)}
                    className={`rounded-full px-6 py-3 text-sm font-medium transition ${
                      active ? "bg-blue text-white" : "bg-white text-gray-2 hover:bg-soft"
                    }`}
                  >
                    {r}
                  </button>
                );
              })}
            </div>

            {receipt === 1 && (
              <div className="flex flex-col gap-7">
                <div className="flex flex-col gap-6 sm:flex-row">
                  <LabeledInput label="회사명" placeholder="회사명 입력" value={companyName} onChange={setCompanyName} />
                  <LabeledInput label="사업자등록번호" placeholder="'-' 없이 입력" value={bizNo} onChange={setBizNo} />
                </div>
                <div className="flex flex-col gap-6 sm:flex-row">
                  <LabeledInput label="대표자" placeholder="대표자명" value={ceo} onChange={setCeo} />
                  <LabeledInput label="담당자 연락처" placeholder="연락처 입력" value={managerPhone} onChange={setManagerPhone} />
                </div>
                <LabeledInput label="이메일" placeholder="이메일 입력" value={taxEmail} onChange={setTaxEmail} />
              </div>
            )}
            {receipt === 2 && (
              <LabeledInput label="휴대폰번호" placeholder="“-” 없이 입력" value={cashReceiptNo} onChange={setCashReceiptNo} />
            )}

            <div className="flex flex-col gap-9">
              <div className="flex flex-col gap-5">
                <div className="flex items-end justify-between rounded-xl border border-line p-10">
                  <div className="flex flex-col gap-3">
                    <span className="text-xl font-normal leading-[30px] text-gray">결제 금액</span>
                    <span className="text-xl font-medium leading-[26px] text-navy">
                      충전 {won(amount)} + VAT {won(vat)}
                    </span>
                  </div>
                  <span className="text-[30px] font-semibold leading-7 text-navy">{won(total)}</span>
                </div>

                {error && <p role="alert" className="text-sm font-medium text-[#ED1C24]">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center justify-center rounded-lg bg-gradient-to-r from-[#E97C5E] via-[#EF552B] to-[#C23610] px-6 py-5 text-lg font-medium sm:px-10 sm:py-8 sm:text-2xl text-white shadow-[12px_12px_24px_rgba(255,141,110,0.6)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {loading ? "신청 중..." : "무통장입금 바로가기"}
                </button>

                {/* 입금 안내 (신청 완료 후) */}
                {done && (
                  <div role="status" aria-live="polite" className="flex flex-col gap-3 rounded-xl border border-blue/40 bg-blue/5 p-8">
                    <p className="text-lg font-semibold text-navy">
                      충전 신청 완료 — 아래 계좌로 입금해주세요
                    </p>
                    <div className="grid grid-cols-1 gap-2 text-base text-navy sm:grid-cols-2">
                      <p>
                        <span className="text-gray">입금 계좌</span>{" "}
                        <span className="font-medium">
                          {bank.bankName} {bank.account}
                        </span>
                      </p>
                      <p>
                        <span className="text-gray">예금주</span>{" "}
                        <span className="font-medium">{bank.holder}</span>
                      </p>
                      <p>
                        <span className="text-gray">입금 금액</span>{" "}
                        <span className="font-semibold text-orange">{won(done.total)}</span>
                      </p>
                      <p>
                        <span className="text-gray">입금자명</span>{" "}
                        <span className="font-medium">{done.depositor}</span>
                      </p>
                    </div>
                    <p className="text-sm text-gray">
                      입금이 확인되면 관리자 승인 후 잔액에 반영됩니다.
                    </p>
                  </div>
                )}
              </div>

              {/* 안내사항 */}
              <div className="flex flex-col gap-3 rounded-2xl bg-soft p-10">
                <p className="text-lg font-medium leading-[26px] text-navy">안내사항</p>
                <div className="text-base leading-[26px]">
                  {copy.charge_notice.split("\n").map((line, i) => (
                    <p key={i} className="text-gray">
                      • {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 내 충전 신청 내역 */}
        {isLoggedIn && (
          <section className="flex flex-col gap-7">
            <SectionTitle>내 충전 신청 내역</SectionTitle>
            {history.length === 0 ? (
              <p className="rounded-xl bg-soft p-8 text-base text-gray">
                충전 신청 내역이 없습니다.
              </p>
            ) : (
              <div className="flex flex-col border-t border-navy">
                {history.map((h) => {
                  const m = statusMeta[h.status];
                  return (
                    <div
                      key={h.id}
                      className="flex items-center justify-between gap-4 border-b border-line py-6"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-lg font-medium text-navy">
                          {won(h.amount)} 충전
                        </span>
                        <span className="text-sm text-gray">
                          입금 {won(h.total)} · 입금자 {h.depositorName} ·{" "}
                          {fmtKSTDate(h.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {h.status === "PENDING" && (
                          <button
                            onClick={async () => {
                              if (!confirm("충전 신청을 취소할까요?")) return;
                              const res = await cancelMyCharge(h.id);
                              if (!res.ok) alert(res.error);
                              router.refresh();
                            }}
                            className="rounded border border-line px-3 py-2 text-xs font-medium text-gray transition hover:bg-soft"
                          >
                            신청 취소
                          </button>
                        )}
                        <span className={`rounded-full px-4 py-2 text-sm font-medium ${m.cls}`}>
                          {m.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
