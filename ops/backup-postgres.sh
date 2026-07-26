#!/usr/bin/env sh
set -eu
umask 077

: "${PGHOST:?required}"
: "${PGPORT:=5432}"
: "${PGDATABASE:?required}"
: "${PGUSER:?required}"
: "${PGPASSWORD:?required}"
: "${BACKUP_DIR:?required}"
: "${BACKUP_ENCRYPTION_RECIPIENT:?required}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"
plain="$BACKUP_DIR/jsboy-$timestamp.dump"
encrypted="$plain.age"

cleanup() { rm -f "$plain"; }
trap cleanup EXIT INT TERM

pg_dump --format=custom --no-owner --no-acl --file="$plain"
pg_restore --list "$plain" >/dev/null
age --recipient "$BACKUP_ENCRYPTION_RECIPIENT" --output "$encrypted" "$plain"
sha256sum "$encrypted" >"$encrypted.sha256"

find "$BACKUP_DIR" -type f -name 'jsboy-*.dump.age*' -mtime +"${BACKUP_RETENTION_DAYS:-35}" -print
printf 'backup_created=%s\n' "$encrypted"
