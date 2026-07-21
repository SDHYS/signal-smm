-- 충전 신청 멱등성 키 (따닥/중복 제출 방지) — Order.clientKey 와 동일 패턴
ALTER TABLE "charge_requests" ADD COLUMN "clientKey" TEXT;
CREATE UNIQUE INDEX "charge_requests_clientKey_key" ON "charge_requests"("clientKey");
