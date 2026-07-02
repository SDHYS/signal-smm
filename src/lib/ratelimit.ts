import "server-only";
import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };

// 인스턴스 메모리 기반 고정 윈도우 — 서버리스에서는 인스턴스별로 카운트되므로
// 완전한 차단이 아닌 버스트(따닥/스크립트 연타) 1차 방어선. 정밀 제한이 필요해지면
// Upstash Ratelimit 등 외부 저장소 기반으로 교체.
const store = new Map<string, Bucket>();
const MAX_ENTRIES = 5000;

function prune(now: number) {
  if (store.size < MAX_ENTRIES) return;
  for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** scope별로 windowMs 동안 max회 허용. 초과 시 false. key 미지정 시 클라이언트 IP 기준. */
export async function rateLimit(
  scope: string,
  opts: { max: number; windowMs: number; key?: string },
): Promise<boolean> {
  const key = opts.key ?? (await clientIp());
  const id = `${scope}:${key}`;
  const now = Date.now();
  prune(now);

  const bucket = store.get(id);
  if (!bucket || bucket.resetAt <= now) {
    store.set(id, { count: 1, resetAt: now + opts.windowMs });
    return true;
  }
  if (bucket.count >= opts.max) return false;
  bucket.count += 1;
  return true;
}

export const RATE_LIMITED_MSG = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
