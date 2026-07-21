"use client";

import { useState } from "react";
import { sendMessage } from "@/app/actions/notification";

export default function AdminMessage() {
  const [username, setUsername] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);
    setSaving(true);
    const res = await sendMessage({ username, body });
    setSaving(false);
    if (res.ok) {
      setMsg("쪽지를 보냈습니다.");
      setUsername("");
      setBody("");
    } else setMsg(res.error ?? "전송 실패");
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-6">
      <p className="text-lg font-semibold text-navy">회원 쪽지 보내기</p>
      <p className="text-sm text-gray">
        보낸 쪽지는 해당 회원의 알림(종 아이콘)에 표시됩니다.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="받는 회원 아이디"
          aria-label="받는 회원 아이디"
          className="rounded border border-line px-4 py-3 text-sm text-navy focus:border-blue focus:outline-none sm:w-52"
        />
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="쪽지 내용"
          aria-label="쪽지 내용"
          className="flex-1 rounded border border-line px-4 py-3 text-sm text-navy focus:border-blue focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={saving}
          className="rounded-lg bg-navy px-6 py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "전송 중..." : "보내기"}
        </button>
      </div>
      {msg && <span className="text-sm text-gray">{msg}</span>}
    </div>
  );
}
