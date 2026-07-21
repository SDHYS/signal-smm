// 입력 길이 상한 검사 — @db.Text/String 컬럼은 무제한이라, 앱단에서 막지 않으면
// 거대한 문자열(수 MB)이 저장·렌더되어 메모리/렌더 DoS가 된다. 초과 시 true.
export function overLen(s: string | null | undefined, max: number): boolean {
  return typeof s === "string" && s.length > max;
}

// 흔한 상한값 — 의미상 넉넉하되 악용은 막는 선.
export const LIMITS = {
  title: 200,
  shortText: 100, // 상품명/카테고리/이름 등
  phone: 30,
  username: 30,
  email: 200,
  password: 72, // bcrypt는 72바이트까지만 사용 — 그 이상은 잘리므로 상한
  content: 20_000, // 문의/공지/블로그 본문
  message: 2_000, // 관리자 쪽지
  settingValue: 20_000, // 약관/소개/문구 등
  url: 500,
  tag: 30,
  tagCount: 10,
} as const;
