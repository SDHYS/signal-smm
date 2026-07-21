-- OrderItem.sentAt: failedDispatchFilter의 items.some 서브쿼리(매 대시보드 로드)용 인덱스
CREATE INDEX "order_items_sentAt_idx" ON "order_items"("sentAt");

-- ChargeRequest: 상태 필터 + createdAt 정렬을 함께 커버 (단일 status 인덱스 대체)
DROP INDEX IF EXISTS "charge_requests_status_idx";
CREATE INDEX "charge_requests_status_createdAt_idx" ON "charge_requests"("status", "createdAt");

-- Inquiry: [status ASC, createdAt DESC] 정렬 조회 커버 (단일 status 인덱스 대체)
DROP INDEX IF EXISTS "inquiries_status_idx";
CREATE INDEX "inquiries_status_createdAt_idx" ON "inquiries"("status", "createdAt");
