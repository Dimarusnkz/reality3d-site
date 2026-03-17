#!/usr/bin/env bash
set -euo pipefail
cd /var/www/reality3d
set -a
source .env
set +a
PORT_VALUE="${PORT:-3001}"
curl -fsS -H "x-cron-secret: ${CRON_SECRET}" "http://127.0.0.1:${PORT_VALUE}/api/cron/reconcile" >/dev/null
