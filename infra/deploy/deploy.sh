#!/usr/bin/env bash
# 운영 서버에서 최신 코드 배포: 빌드 → 마이그레이션 → 기동
set -euo pipefail
cd "$(dirname "$0")/../.."

echo "▶ git pull"
git pull --ff-only

echo "▶ docker compose build & up"
docker compose -f infra/docker-compose.yml --env-file infra/.env up -d --build

echo "▶ 상태"
docker compose -f infra/docker-compose.yml ps
echo "✅ 배포 완료"
