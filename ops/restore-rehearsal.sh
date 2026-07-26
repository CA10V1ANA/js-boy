#!/usr/bin/env sh
set -eu
umask 077

: "${RESTORE_TARGET_ENV:?required}"
: "${RESTORE_DATABASE:?required}"
: "${BACKUP_FILE:?required}"
: "${AGE_IDENTITY_FILE:?required}"

if [ "$RESTORE_TARGET_ENV" = "production" ]; then
  echo "Refusing to restore into production" >&2
  exit 2
fi
case "$RESTORE_DATABASE" in
  *test*|*rehearsal*|*restore*) ;;
  *) echo "Target database name must identify a test/rehearsal database" >&2; exit 2 ;;
esac

plain="$(mktemp "${TMPDIR:-/tmp}/jsboy-restore.XXXXXX.dump")"
cleanup() { rm -f "$plain"; }
trap cleanup EXIT INT TERM

sha256sum --check "$BACKUP_FILE.sha256"
age --decrypt --identity "$AGE_IDENTITY_FILE" --output "$plain" "$BACKUP_FILE"
pg_restore --list "$plain" >/dev/null
pg_restore --exit-on-error --clean --if-exists --no-owner --no-acl \
  --dbname="$RESTORE_DATABASE" "$plain"
psql --dbname="$RESTORE_DATABASE" --set=ON_ERROR_STOP=1 \
  --command='select count(*) as flyway_migrations from flyway_schema_history;'
printf 'restore_rehearsal_complete=%s\n' "$RESTORE_DATABASE"
