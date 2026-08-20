#!/usr/bin/env sh
set -eu
umask 077

: "${PROOF_STORAGE_DIR:?required}"
: "${BACKUP_DIR:?required}"
: "${BACKUP_ENCRYPTION_RECIPIENT:?required}"

case "$PROOF_STORAGE_DIR" in
  /|"") echo "invalid_proof_storage_dir" >&2; exit 2 ;;
esac

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"
plain="$BACKUP_DIR/jsboy-proofs-$timestamp.tar"
encrypted="$plain.age"

cleanup() { rm -f "$plain"; }
trap cleanup EXIT INT TERM

tar --create --file "$plain" --directory "$PROOF_STORAGE_DIR" .
tar --list --file "$plain" >/dev/null
age --recipient "$BACKUP_ENCRYPTION_RECIPIENT" --output "$encrypted" "$plain"
sha256sum "$encrypted" >"$encrypted.sha256"

find "$BACKUP_DIR" -type f -name 'jsboy-proofs-*.tar.age*' \
  -mtime +"${BACKUP_RETENTION_DAYS:-35}" -print
printf 'proof_backup_created=%s\n' "$encrypted"
