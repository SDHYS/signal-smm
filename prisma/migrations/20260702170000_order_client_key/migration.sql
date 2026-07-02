-- 주문 멱등성 키 (중복 제출 방지)
ALTER TABLE "orders" ADD COLUMN "clientKey" TEXT;

CREATE UNIQUE INDEX "orders_clientKey_key" ON "orders"("clientKey");
