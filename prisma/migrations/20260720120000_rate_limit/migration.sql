-- 서버리스 다중 인스턴스 공유 rate-limit 카운터 (고정 윈도우)
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "rate_limits_resetAt_idx" ON "rate_limits"("resetAt");
