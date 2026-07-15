import "server-only";

/**
 * 도매(공급사) SMM 패널 API 클라이언트 — realsite.shop 규격 (표준 SMM Panel v2)
 *
 * 자격증명은 환경변수로만 관리한다 (임시 계정 → 실계정 전환 시 env만 교체):
 *  - SMM_API_URL  (기본 https://realsite.shop/api/v2)
 *  - SMM_API_KEY  (없으면 연동 기능 전체가 "수동 모드"로 동작 — 발주 안 함)
 *  - SMM_USD_KRW  (원가 환산 환율, 기본 1450)
 */

const DEFAULT_URL = "https://realsite.shop/api/v2";

export type SmmService = {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string; // USD / 1000개
  min: number | string;
  max: number | string;
  refill: boolean;
  cancel: boolean;
  dripfeed?: boolean;
};

export type SmmOrderStatus =
  | {
      charge?: string;
      start_count?: string;
      status: string; // Pending | In progress | Processing | Completed | Partial | Canceled | Refunded
      remains?: string;
      currency?: string;
    }
  | { error: string };

export function smmConfigured(): boolean {
  return Boolean(process.env.SMM_API_KEY);
}

export function usdKrw(): number {
  const v = Number(process.env.SMM_USD_KRW);
  return Number.isFinite(v) && v > 0 ? v : 1450;
}

/** 도매 단가(USD/1000) → 원/개 */
export function costPerUnitKrw(rate: number): number {
  return (rate * usdKrw()) / 1000;
}

async function call<T>(params: Record<string, string>): Promise<T> {
  const key = process.env.SMM_API_KEY;
  if (!key) throw new Error("SMM_API_KEY 환경변수가 설정되지 않았습니다.");

  const res = await fetch(process.env.SMM_API_URL || DEFAULT_URL, {
    method: "POST",
    body: new URLSearchParams({ key, ...params }),
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`SMM API HTTP ${res.status}`);

  const data: unknown = await res.json();
  if (data && typeof data === "object" && !Array.isArray(data) && "error" in data)
    throw new Error(`SMM API: ${(data as { error: string }).error}`);
  return data as T;
}

// 서비스 목록은 무겁고(700+건) 자주 안 바뀌므로 인스턴스 메모리에 10분 캐시
let servicesCache: { at: number; data: SmmService[] } | null = null;

export async function getServices(force = false): Promise<SmmService[]> {
  if (!force && servicesCache && Date.now() - servicesCache.at < 10 * 60_000)
    return servicesCache.data;
  const data = await call<SmmService[]>({ action: "services" });
  servicesCache = { at: Date.now(), data };
  return data;
}

/** 발주. 성공 시 공급사 주문번호 반환 */
export async function addOrder(input: {
  service: number;
  link: string;
  quantity: number;
}): Promise<string> {
  const r = await call<{ order: number | string }>({
    action: "add",
    service: String(input.service),
    link: input.link,
    quantity: String(input.quantity),
  });
  if (!r || r.order === undefined) throw new Error("SMM API: 주문번호 없음");
  return String(r.order);
}

/** 주문 상태 조회 (여러 건, 최대 100) — 주문번호 → 상태 맵 */
export async function getOrdersStatus(
  ids: string[],
): Promise<Record<string, SmmOrderStatus>> {
  if (ids.length === 0) return {};
  if (ids.length === 1) {
    // 단건은 응답 형태가 다름 (맵이 아닌 단일 객체)
    const r = await call<SmmOrderStatus>({ action: "status", order: ids[0] });
    return { [ids[0]]: r };
  }
  return call<Record<string, SmmOrderStatus>>({
    action: "status",
    orders: ids.slice(0, 100).join(","),
  });
}

export async function getBalance(): Promise<{ balance: string; currency: string }> {
  return call<{ balance: string; currency: string }>({ action: "balance" });
}
