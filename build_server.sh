#!/bin/bash
set -euo pipefail
cd /var/www/reality3d
prev_dir=""
if [ -d .next ]; then
  prev_dir=".next_prev_$(date +%s)"
  mv .next "$prev_dir"
fi

cleanup_on_fail() {
  code=$?
  if [ $code -ne 0 ]; then
    rm -rf .next || true
    if [ -n "${prev_dir}" ] && [ -d "${prev_dir}" ]; then
      mv "${prev_dir}" .next || true
    fi
  fi
  exit $code
}
trap cleanup_on_fail EXIT

npx prisma migrate deploy > build_log.txt 2>&1
npx prisma generate >> build_log.txt 2>&1
npm run build >> build_log.txt 2>&1

if [ -n "${prev_dir}" ] && [ -d "${prev_dir}" ]; then
  rm -rf "${prev_dir}"
fi

trap - EXIT
echo "BUILD_FINISHED" >> build_log.txt
