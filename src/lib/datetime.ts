// 서버 런타임(Vercel=UTC)에서도 항상 한국 시각으로 포맷한다.
// toLocaleString은 timeZone 미지정 시 런타임 TZ를 쓰므로 관리자에게 9시간 빠른(UTC) 시각이 보인다.
const KST = "Asia/Seoul";

export function fmtKST(d: Date | string): string {
  return new Date(d).toLocaleString("ko-KR", { timeZone: KST });
}

// KST 기준 날짜(YYYY.MM.DD)만
export function fmtKSTDate(d: Date | string): string {
  return new Date(d)
    .toLocaleDateString("ko-KR", { timeZone: KST, year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\.\s?$/, "")
    .replace(/\.\s/g, ".");
}

// KST "YYYY-MM-DD HH:mm:ss" (CSV/로그용, 정렬 가능한 형태)
export function fmtKSTStamp(d: Date | string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date(d));
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${g("year")}-${g("month")}-${g("day")} ${g("hour")}:${g("minute")}:${g("second")}`;
}
