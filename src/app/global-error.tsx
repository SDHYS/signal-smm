"use client";

import { useEffect } from "react";

// 루트 레이아웃에서 발생한 에러까지 잡는 최상위 바운더리 (자체 html/body 필요).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("global error", error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          fontFamily: "system-ui, sans-serif",
          color: "#1f2353",
          textAlign: "center",
          padding: 16,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>일시적인 오류가 발생했습니다</h1>
        <p style={{ fontSize: 14, color: "#767676", lineHeight: 1.6 }}>
          잠시 후 다시 시도해주세요.
        </p>
        <button
          onClick={reset}
          style={{
            borderRadius: 8,
            background: "#1f2353",
            color: "#fff",
            border: "none",
            padding: "12px 24px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          다시 시도
        </button>
      </body>
    </html>
  );
}
