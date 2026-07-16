/**
 * href로 렌더할 URL을 안전하게 정규화한다.
 * http/https만 허용하고, javascript:/data: 등 위험 스킴은 null로 반환한다.
 * (신규 주문은 서버에서 이미 검증하지만, 과거 데이터·이중 방어용)
 */
export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}
