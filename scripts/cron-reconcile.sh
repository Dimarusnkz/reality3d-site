#!/usr/bin/env bash
set -euo pipefail
cd /var/www/reality3d
set -a
source .env
set +a
if [ -n "${PORT:-}" ]; then
  curl -fsS -H "x-cron-secret: ${CRON_SECRET}" "http://127.0.0.1:${PORT}/api/cron/reconcile" >/dev/null
  exit 0
fi

for p in 3000 3001 3002; do
  if curl -fsS -H "x-cron-secret: ${CRON_SECRET}" "http://127.0.0.1:${p}/api/cron/reconcile" >/dev/null; then
    exit 0
  fi
done

exit 1
