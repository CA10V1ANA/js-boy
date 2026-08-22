#!/bin/sh
set -eu

storage_root="${APP_STORAGE_LOCAL_ROOT:-/var/lib/jsboy/proofs}"

if [ "$(id -u)" = "0" ]; then
    mkdir -p "$storage_root"
    if ! su-exec jsboy:jsboy test -w "$storage_root"; then
        chown -R jsboy:jsboy "$storage_root"
    fi
    exec su-exec jsboy:jsboy java -jar /app/app.jar
fi

exec java -jar /app/app.jar