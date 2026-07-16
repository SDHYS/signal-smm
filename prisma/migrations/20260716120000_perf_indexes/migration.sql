-- 성능: 필터+정렬 핫패스에 복합 인덱스 (감사 반영)

-- Order: userId+createdAt (주문내역·회원상세), status+createdAt (관리자 주문목록 딥페이지)
DROP INDEX IF EXISTS "orders_userId_idx";
DROP INDEX IF EXISTS "orders_status_idx";
CREATE INDEX "orders_userId_createdAt_idx" ON "orders"("userId", "createdAt");
CREATE INDEX "orders_status_createdAt_idx" ON "orders"("status", "createdAt");

-- ChargeRequest: userId+createdAt (회원상세 충전내역)
DROP INDEX IF EXISTS "charge_requests_userId_idx";
CREATE INDEX "charge_requests_userId_createdAt_idx" ON "charge_requests"("userId", "createdAt");

-- Notification: userId+createdAt (레이아웃 매 페이지 최근 10건 정렬)
DROP INDEX IF EXISTS "notifications_createdAt_idx";
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");
