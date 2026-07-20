import "dotenv/config";
import { prisma } from "@/lib/prisma";

process.env.AUTH_SECRET ??= "test-secret-key-for-vitest-only";
// getSettingsMap은 process.env.VITEST(러너가 자동 설정)를 감지해 캐시를 우회한다.

// rate-limit은 이제 DB 공유 저장소라 실행 간 상태가 남는다. 테스트 결정성을 위해
// 각 파일 시작 시 카운터를 비운다(파일 단위 직렬 실행이라 안전).
await prisma.rateLimit.deleteMany({});
