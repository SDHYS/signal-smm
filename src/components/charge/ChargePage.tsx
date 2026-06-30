"use client";

import { useState } from "react";

const presets = [
  { label: "+ 1만원", value: 10000 },
  { label: "+ 3만원", value: 30000 },
  { label: "+ 5만원", value: 50000 },
  { label: "+ 7만원", value: 70000 },
  { label: "+ 10만원", value: 100000 },
  { label: "+ 30만원", value: 300000 },
  { label: "+ 50만원", value: 500000 },
  { label: "+ 100만원", value: 1000000 },
];

const receiptOptions = ["신청안함", "세금계산서", "현금영수증"];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[28px] font-bold leading-[38px] text-navy">{children}</h2>
  );
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
  return (
    <div className="flex flex-1 flex-col gap-2">
      <span className="text-sm font-medium text-[#222222]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-line px-4 py-5 text-sm text-navy placeholder:text-gray focus:border-blue focus:outline-none"
      />
    </div>
  );
}

const won = (n: number) => `${n.toLocaleString()}원`;

export default function ChargePage() {
  const [amount, setAmount] = useState(0);
  const [depositor, setDepositor] = useState("");
  const [receipt, setReceipt] = useState(0);

  // 세금계산서 정보
  const [companyName, setCompanyName] = useState("");
  const [bizNo, setBizNo] = useState("");
  const [ceo, setCeo] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [taxEmail, setTaxEmail] = useState("");
  // 현금영수증 정보
  const [cashReceiptNo, setCashReceiptNo] = useState("");

  const balance = 0; // 현재 보유잔액 (추후 회원 데이터 연동)
  const vat = Math.round(amount * 0.1);
  const total = amount + vat;

  return (
    <div className="flex flex-col gap-12 pt-2">
      {/* 헤더 */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2.5">
          <p className="text-base font-normal text-[#767676]">임시타이틀</p>
          <h1 className="text-[40px] font-bold leading-[52px] text-black">
            잔액충전
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-blue px-6 py-3 text-sm font-medium text-white">
            무통장 입금
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-16">
        {/* 충전 금액 선택 */}
        <section className="flex flex-col gap-8">
          <SectionTitle>충전 금액 선택</SectionTitle>
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {presets.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setAmount((a) => a + p.value)}
                  className="rounded border border-line px-4 py-6 text-lg font-medium text-navy transition hover:border-blue hover:text-blue"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-end justify-between rounded-[10px] bg-soft p-10">
                <div className="flex flex-col gap-4">
                  <span className="text-lg font-normal leading-[26px] text-gray">
                    충전후 잔액
                  </span>
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

        {/* 입금자명 작성 */}
        <section className="flex flex-col gap-8">
          <SectionTitle>입금자명 작성</SectionTitle>
          <div className="flex flex-col gap-3">
            <input
              value={depositor}
              onChange={(e) => setDepositor(e.target.value)}
              placeholder="입금자명을 작성해주세요"
              className="w-full rounded-lg border border-line bg-white px-6 py-7 text-lg font-normal text-navy placeholder:text-gray focus:border-blue focus:outline-none"
            />
            <p className="text-sm font-normal leading-6 text-navy">
              입금자명이 다를 경우 자동충전이 안됩니다.
              <br />
              5글자 이상 예금주명도 정상반영 처리 됩니다.
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

            {/* 세금계산서 정보 */}
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

            {/* 현금영수증 정보 */}
            {receipt === 2 && (
              <LabeledInput
                label="휴대폰번호"
                placeholder="“-” 없이 입력"
                value={cashReceiptNo}
                onChange={setCashReceiptNo}
              />
            )}

            <div className="flex flex-col gap-9">
              <div className="flex flex-col gap-5">
                {/* 결제 금액 */}
                <div className="flex items-end justify-between rounded-xl border border-line p-10">
                  <div className="flex flex-col gap-3">
                    <span className="text-xl font-normal leading-[30px] text-gray">
                      결제 금액
                    </span>
                    <span className="text-xl font-medium leading-[26px] text-navy">
                      충전 {amount.toLocaleString()}원 + VAT {vat.toLocaleString()}원
                    </span>
                  </div>
                  <span className="text-[30px] font-semibold leading-7 text-navy">
                    {won(total)}
                  </span>
                </div>

                <button className="flex items-center justify-center rounded-lg bg-gradient-to-r from-[#E97C5E] via-[#EF552B] to-[#C23610] px-10 py-8 text-2xl font-medium text-white shadow-[12px_12px_24px_rgba(255,141,110,0.6)] transition-transform hover:-translate-y-0.5">
                  무통장입금 바로가기
                </button>
              </div>

              {/* 안내사항 */}
              <div className="flex flex-col gap-3 rounded-2xl bg-soft p-10">
                <p className="text-lg font-medium leading-[26px] text-navy">안내사항</p>
                <div className="text-base leading-[26px]">
                  <p>
                    <span className="text-gray">• </span>
                    <span className="font-medium text-navy">
                      충전 신청 후 입금을 진행해야 합니다.
                    </span>
                    <span className="text-gray">
                      {" "}
                      신청 시 계좌번호를 확인할 수 있습니다.
                    </span>
                  </p>
                  <p className="text-gray">
                    • 현금영수증 및 세금계산서는 영업일 24시간 내 자동 발행됩니다.
                  </p>
                  <p className="text-gray">
                    • 부가세를 제외한 금액만 이체하셨다면, 하단의 &apos;입금 대기&apos;
                    화면에서 부족한 금액을 추가로 송금하시면 자동으로 충전이 완료됩니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
