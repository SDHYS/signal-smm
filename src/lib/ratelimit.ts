import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "./prisma";

// 공유(DB) 고정 윈도우 rate-limit — 서버리스 다중 인스턴스에서 일관된 카운트.
// 인메모리 Map은 인스턴스별로 분리돼 로그인 무차별 대입 방어가 인스턴스 수만큼
// 약화되므로, 원자적 upsert(단일 SQL)로 경쟁 없이 카운트한다.

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** scope별로 windowMs 동안 max회 허용. 초과 시 false. key 미지정 시 클라이언트 IP 기준. */
export async function rateLimit(
  scope: string,
  opts: { max: number; windowMs: number; key?: string },
): Promise<boolean> {
  const rawKey = opts.key ?? (await clientIp());
  // 키 길이 상한 — 공격자 제어 키(예: username)가 btree 인덱스 최대치를 넘겨 INSERT를
  // 실패시키면 아래 catch가 fail-open 되어 리미터가 우회된다. 긴 키는 해시로 고정 길이화.
  const key = rawKey.length > 128 ? createHash("sha256").update(rawKey).digest("hex") : rawKey;
  const id = `${scope}:${key}`;
  const windowMs = Math.max(1, Math.floor(opts.windowMs));

  try {
    // 원자적 고정 윈도우: 만료됐으면 리셋(count=1), 아니면 +1. 단일 문장이라
    // 동시 요청(다중 인스턴스 포함)이 경쟁해도 정확히 카운트된다.
    // resetAt 은 리셋 시에만 갱신 → 윈도우가 슬라이딩으로 연장되지 않음.
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO rate_limits (id, count, "resetAt")
      VALUES (${id}, 1, now() + interval '1 millisecond' * ${windowMs}::float8)
      ON CONFLICT (id) DO UPDATE SET
        count = CASE WHEN rate_limits."resetAt" <= now() THEN 1 ELSE rate_limits.count + 1 END,
        "resetAt" = CASE
          WHEN rate_limits."resetAt" <= now()
          THEN now() + interval '1 millisecond' * ${windowMs}::float8
          ELSE rate_limits."resetAt"
        END
      RETURNING count
    `;

    // 만료 행 청소(확률적) — 테이블 무한 증가 방지. 실패는 무시.
    if (Math.random() < 0.02) {
      prisma
        .$executeRaw`DELETE FROM rate_limits WHERE "resetAt" < now() - interval '1 hour'`
        .catch(() => {});
    }

    const count = Number(rows[0]?.count ?? 1);
    return count <= opts.max;
  } catch (e) {
    // DB 오류 시 fail-open — 리미터 장애가 정상 사용자를 잠그면 안 된다.
    // (DB가 죽으면 로그인 등은 사용자 조회 단계에서 어차피 실패하므로 보안 저하가 아님)
    console.error("rateLimit db error", { id }, e);
    return true;
  }
}

export const RATE_LIMITED_MSG = "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
