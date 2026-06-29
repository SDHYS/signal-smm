# 배포 가이드

단일 노드(예: AWS Lightsail / 일반 VPS) 기준. Docker Compose 로 `app + db + nginx` 를 함께 띄운다.

## 사전 준비

- 서버에 Docker / Docker Compose 설치
- 도메인 A 레코드를 서버 IP 로 연결
- 80/443 포트 개방

## 1) 코드 가져오기

```bash
git clone <repo-url> signalsmm
cd signalsmm
```

## 2) 운영 환경변수

```bash
cp infra/.env.example infra/.env
# infra/.env 편집: POSTGRES_PASSWORD, DATABASE_URL, AUTH_SECRET 채우기
#   AUTH_SECRET 생성:  openssl rand -base64 48
```

> `DATABASE_URL` 의 호스트는 compose 내부 서비스명 `db`, 포트 `5432` 를 사용한다.
> 예: `postgresql://signalsmm:<pw>@db:5432/signalsmm?schema=public`

## 3) 기동

```bash
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build
```

- `app` 컨테이너는 기동 시 `prisma migrate deploy` 로 스키마를 자동 적용한다.
- 최초 1회 시드:
  ```bash
  docker compose -f infra/docker-compose.yml exec app npx tsx prisma/seed.ts
  ```

## 4) HTTPS (Let's Encrypt)

1. `infra/nginx/conf.d/signalsmm.conf` 의 `server_name` 을 실제 도메인으로 변경
2. certbot 으로 인증서 발급(웹루트 `/var/www/certbot`)
3. conf 의 443 server 블록 주석 해제 + 80 → 443 리다이렉트로 전환
4. `docker compose ... restart nginx`

## 5) 배포 갱신

```bash
bash infra/deploy/deploy.sh   # git pull → build → up -d
```

## 6) 백업

```bash
bash infra/deploy/db-backup.sh   # pg_dump → gzip, 14일 경과분 정리
# cron 예:  0 4 * * *  cd /path/signalsmm && bash infra/deploy/db-backup.sh
```

## 헬스체크

- `GET /api/health` → `{ "status": "ok", "db": "up" }`
- 로드밸런서/모니터링에서 이 엔드포인트를 사용.

## 운영 체크리스트

- [ ] `AUTH_SECRET` 무작위 값으로 교체
- [ ] `POSTGRES_PASSWORD` 강력한 값
- [ ] 시드 관리자 비밀번호 변경
- [ ] HTTPS 적용 및 80→443 리다이렉트
- [ ] DB 백업 cron 등록
