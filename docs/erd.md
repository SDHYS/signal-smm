# 데이터 모델 (ERD)

`prisma/schema.prisma` 기준. 핵심은 **회원(User)** 과 **주문(Order)** 이며, 결제는 무통장입금/계좌이체를 관리자가 수동 확인한다.

## 엔티티 개요

| 모델 | 설명 |
|------|------|
| `User` | 회원(일반/관리자). `role` 로 구분 |
| `Product` | 판매 상품 = SMM 서비스(인스타 팔로워 등). 단가/최소·최대 수량 |
| `Order` | 주문. 상태(`OrderStatus`)로 입금대기→결제완료→진행→완료 흐름 |
| `OrderItem` | 주문 항목. 주문 시점의 상품명/단가 스냅샷 + 작업 대상 URL |
| `Setting` | key-value 사이트 설정(입금 은행/계좌/예금주, 사이트명) |

## 관계

```
User 1 ──< Order 1 ──< OrderItem >── 1 Product
```

- `User` 1 : N `Order`
- `Order` 1 : N `OrderItem`
- `Product` 1 : N `OrderItem`

## 주문 상태 흐름 (OrderStatus)

```
PENDING_PAYMENT  ── 고객이 주문 생성, 입금 대기
      │  (관리자가 입금 확인 후 "결제완료" 클릭)
      ▼
PAID             ── 입금 확인됨 (paidAt, confirmedById 기록)
      │  (작업 시작)
      ▼
PROCESSING       ── 작업 진행중
      │
      ▼
COMPLETED        ── 작업 완료 (completedAt 기록)

* 어느 단계에서든 CANCELLED 로 취소 가능 (cancelledAt 기록)
```

## 결제(무통장/계좌이체) 처리 방식

PG 연동이 없으므로 결제 정보는 별도 테이블 대신 `Order` 에 기록한다.

- 입금 계좌 안내값: `Setting`(`bank_name`/`bank_account`/`bank_holder`)
- 고객 입금자명: `Order.depositorName`
- 관리자가 통장/계좌 내역 확인 → `status = PAID`, `paidAt`, `confirmedById` 갱신
- 메모: 고객 `Order.memo`, 관리자 `Order.adminMemo`

## 주요 인덱스

- `Order.userId`, `Order.status`, `Order.createdAt` — 관리자 주문 목록 필터/정렬
- `Product.category`, `Product.isActive` — 카탈로그 조회
- `User.email` unique, `Order.orderNo` unique

## 금액 표기

모든 금액은 **원(KRW) 정수**(`Int`)로 저장한다. (소수점 없음)
