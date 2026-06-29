#!/usr/bin/env bash
# DB 덤프 백업. cron 예: 0 4 * * * /path/infra/deploy/db-backup.sh
set -euo pipefail
cd "$(dirname "$0")/../.."

BACKUP_DIR="${BACKUP_DIR:-$HOME/signalsmm-backups}"
mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/signalsmm-$STAMP.sql.gz"

docker compose -f infra/docker-compose.yml exec -T db \
  pg_dump -U "${POSTGRES_USER:-signalsmm}" "${POSTGRES_DB:-signalsmm}" | gzip > "$OUT"

echo "✅ 백업 생성: $OUT"
# 14일 이상 된 백업 정리
find "$BACKUP_DIR" -name 'signalsmm-*.sql.gz' -mtime +14 -delete
