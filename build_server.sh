#!/bin/bash
set -euo pipefail
cd /var/www/reality3d
rm -rf .next
npx prisma migrate deploy > build_log.txt 2>&1
npx prisma generate >> build_log.txt 2>&1
npm run build >> build_log.txt 2>&1
echo "BUILD_FINISHED" >> build_log.txt
