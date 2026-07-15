-- 도매(공급사) 연동: 상품 매핑 + 주문 아이템 발주 상태
ALTER TABLE "products"
  ADD COLUMN "providerServiceId" INTEGER,
  ADD COLUMN "providerRate" DOUBLE PRECISION,
  ADD COLUMN "providerMeta" TEXT;

ALTER TABLE "order_items"
  ADD COLUMN "providerOrderId" TEXT,
  ADD COLUMN "providerStatus" TEXT,
  ADD COLUMN "providerRemains" INTEGER,
  ADD COLUMN "providerError" TEXT,
  ADD COLUMN "sentAt" TIMESTAMP(3),
  ADD COLUMN "syncedAt" TIMESTAMP(3);

CREATE INDEX "order_items_providerOrderId_idx" ON "order_items"("providerOrderId");
