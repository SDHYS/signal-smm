# SignalSMM — 소셜미디어 마케팅 쇼핑몰

SMM(소셜미디어 마케팅) 서비스 판매 자사몰. 결제는 **무통장입금/계좌이체(수동 입금확인)** 방식이며 PG 연동이 없습니다. 관리자가 입금 내역을 확인한 뒤 직접 "결제완료" 처리합니다.

## 기술 스택

- **Framework**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 — 프론트/백엔드 단일 코드베이스
- **DB / ORM**: PostgreSQL 16 + Prisma 7 (pg 드라이버 어댑터)
- **인증**: 자체 세션(bcrypt 비밀번호 해시), 관리자/일반회원 role 구분
- **인프라**: Docker Compose 단일 노드 + Nginx 리버스 프록시 + Let's Encrypt
- **관리자**: 동일 앱 내 `/admin` 경로

## 폴더 구조

```
signalsmm/
├── src/
│   ├── app/
│   │   ├── api/health/        헬스체크(DB 연결 확인)
│   │   ├── (shop)/            고객 쇼핑몰 (예정)
│   │   └── admin/             관리자 (예정)
│   └── lib/
│       └── prisma.ts          Prisma Client 싱글톤 (pg 어댑터)
├── prisma/
│   ├── schema.prisma          DB 스키마 (User/Product/Order/OrderItem/Setting)
│   └── seed.ts                초기 데이터(관리자·샘플상품·입금계좌)
├── prisma.config.ts           Prisma 7 설정(마이그레이션 datasource)
├── Dockerfile                 앱 standalone 멀티스테이지 빌드
├── infra/
│   ├── docker-compose.local.yml   로컬 DB만
│   ├── docker-compose.yml         운영(app+db+nginx)
│   ├── .env.example               운영 환경변수 견본
│   ├── nginx/                     Nginx 설정 + SSL
│   └── deploy/                    deploy.sh · db-backup.sh
└── docs/
    ├── erd.md                 데이터 모델 설명
    └── deployment.md          배포 가이드
```

## 로컬 개발

### 1) 환경변수
```bash
cp .env.example .env
```

### 2) 로컬 DB 기동 (Docker)
```bash
docker compose -f infra/docker-compose.local.yml up -d
```
- 호스트 포트 **5433** → 컨테이너 5432

### 3) 마이그레이션 & 시드
```bash
npm run db:migrate     # 스키마 적용
npm run db:seed        # 관리자/샘플상품/입금계좌
```

### 4) 개발 서버
```bash
npm run dev            # http://localhost:3050
```
- 헬스체크: http://localhost:3050/api/health → `{ "status": "ok", "db": "up" }`
- 시드 관리자: `admin@signalsmm.local` / `Admin1234!`

## 주요 npm 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 (포트 3050) |
| `npm run build` | `prisma generate` 후 프로덕션 빌드 |
| `npm run db:migrate` | 개발 마이그레이션 생성/적용 |
| `npm run db:deploy` | 운영 마이그레이션 적용 |
| `npm run db:studio` | Prisma Studio (DB GUI) |
| `npm run db:seed` | 시드 데이터 주입 |

배포는 [docs/deployment.md](docs/deployment.md), 데이터 모델은 [docs/erd.md](docs/erd.md) 참고.
