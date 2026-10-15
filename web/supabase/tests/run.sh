#!/usr/bin/env bash
# Runs every *.test.sql file against the local database from scripts/local-supabase.sh.
set -euo pipefail
cd "$(dirname "$0")"
DB_URL="${LOCAL_DATABASE_URL:-postgres://postgres@127.0.0.1:54322/postgres}"
for f in *.test.sql; do
  echo "== $f"
  psql "$DB_URL" -X -q -v ON_ERROR_STOP=1 -f "$f" 2>&1 | sed -n 's/^.*NOTICE:  //p; /ERROR/p'
  [ "${PIPESTATUS[0]}" = 0 ] || { echo "FAILED: $f"; exit 1; }
done
