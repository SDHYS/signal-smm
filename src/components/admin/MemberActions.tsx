"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adjustBalance, resetPassword } from "@/app/actions/members";
import { sendMessage } from "@/app/actions/notification";

export default function MemberActions({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [tempPw, setTempPw] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [msgSent, setMsgSent] = useState(false);

  async function adjust(sign: 1 | -1) {
    const v = Number(amount);
    if (!v) return alert("조정 금액을 입력해주세요.");
    if (sign === -1 && !confirm(`${v.toLocaleString()}원을 차감할까요?`)) return;
    setBusy(true);
    const res = await adjustBalance(userId, sign * v, reason.trim() || undefined);
    setBusy(false);
    if (!res.ok) alert(res.error);
    else {
      setAmount("");
      setReason("");
    }
    router.refresh();
  }

  async function reset() {
    if (!confirm(`${username} 회원의 비밀번호를 초기화할까요?`)) return;
    setBusy(true);
    const res = await resetPassword(userId);
    setBusy(false);
    if (res.ok) setTempPw(res.data ?? null);
    else alert(res.error);
  }

  async function send() {
    if (!msg.trim()) return alert("쪽지 내용을 입력해주세요.");
    setBusy(true);
    const res = await sendMessage({ username, body: msg.trim() });
    setBusy(false);
    if (res.ok) {
      setMsg("");
      setMsgSent(true);
      setTimeout(() => setMsgSent(false), 1500);
      router.refresh();
    } else alert(res.error);
  }

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-line bg-white p-6">
      <h2 className="text-lg font-semibold text-navy">회원 관리</h2>

      {/* 잔액 조정 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray">잔액 조정</span>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="금액"
            className="w-32 rounded border border-line px-3 py-2 text-sm text-navy focus:border-blue focus:outline-none"
          />
          <button
            onClick={() => adjust(1)}
            disabled={busy}
            className="rounded bg-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            증액
          </button>
          <button
            onClick={() => adjust(-1)}
            disabled={busy}
            className="rounded border border-line px-4 py-2 text-sm font-medium text-gray disabled:opacity-50"
          >
            차감
          </button>
        </div>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="조정 사유 (선택 — 감사 로그에 기록)"
          aria-label="잔액 조정 사유"
          className="w-full rounded border border-line px-3 py-2 text-sm text-navy placeholder:text-gray focus:border-blue focus:outline-none"
        />
      </div>

      {/* 비밀번호 초기화 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray">비밀번호</span>
        <button
          onClick={reset}
          disabled={busy}
          className="self-start rounded border border-line px-4 py-2 text-sm font-medium text-navy hover:bg-soft disabled:opacity-50"
        >
          비밀번호 초기화
        </button>
        {tempPw && (
          <span className="text-sm font-medium text-orange">
            임시 비밀번호: {tempPw} (지금만 표시됩니다 — 회원에게 전달하세요)
          </span>
        )}
      </div>

      {/* 쪽지 보내기 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-gray">쪽지 보내기</span>
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="회원에게 보낼 쪽지 (알림으로 전달)"
          rows={2}
          className="w-full resize-y rounded border border-line px-3 py-2 text-sm text-navy focus:border-blue focus:outline-none"
        />
        <button
          onClick={send}
          disabled={busy}
          className="self-start rounded bg-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {msgSent ? "전송됨" : "쪽지 전송"}
        </button>
      </div>
    </div>
  );
}
