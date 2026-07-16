-- 주문 시점 도매 서비스 ID 스냅샷 (상품 재매핑돼도 원래 서비스로 발주)
ALTER TABLE "order_items" ADD COLUMN "providerServiceIdSnapshot" INTEGER;
