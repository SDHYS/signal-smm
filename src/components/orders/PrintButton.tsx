"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-lg bg-navy px-8 py-4 text-base font-medium text-white transition hover:opacity-90"
    >
      인쇄하기
    </button>
  );
}
