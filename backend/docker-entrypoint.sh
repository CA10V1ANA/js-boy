#!/bin/sh
set -eu

storage_root="${APP_STORAGE_LOCAL_ROOT:-/var/lib/jsboy/proofs}"

# Public CA certificate supplied by the database operator, never connection credentials.
if [ -n "${DB_SSL_ROOT_CERT_PEM:-}" ]; then
    printf '%s\n' "$DB_SSL_ROOT_CERT_PEM" > /tmp/jsboy-db-root.crt
    chmod 600 /tmp/jsboy-db-root.crt
    if [ "$(id -u)" = "0" ]; then
        chown jsboy:jsboy /tmp/jsboy-db-root.crt
    fi
fi

if [ "$(id -u)" = "0" ]; then
    mkdir -p "$storage_root"
    if ! su-exec jsboy:jsboy test -w "$storage_root"; then
        chown -R jsboy:jsboy "$storage_root"
    fi
    exec su-exec jsboy:jsboy java -jar /app/app.jar
fi

exec java -jar /app/app.jar
