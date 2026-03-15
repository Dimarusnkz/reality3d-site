#!/bin/bash
cd /var/www/reality3d
rm -rf .next
npm run build > build_log.txt 2>&1
echo "BUILD_FINISHED" >> build_log.txt
