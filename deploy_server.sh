#!/bin/bash
set -euo pipefail
cd /var/www/reality3d

git fetch origin
git reset --hard origin/main
npm install

./build_server.sh

pm2 restart reality3d --update-env || pm2 start reality3d --update-env

ok=0
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/ || true)
  if [ "$code" = "200" ] || [ "$code" = "307" ]; then
    ok=1
    break
  fi
  sleep 1
done

if [ "$ok" != "1" ]; then
  pm2 logs reality3d --lines 120 --nostream --raw | tail -n 120
  exit 1
fi

pm2 status reality3d --no-color
