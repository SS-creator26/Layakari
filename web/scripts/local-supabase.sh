#!/usr/bin/env bash
# A small local Supabase for development, tests and CI: Postgres + GoTrue (auth) + PostgREST,
# behind a gateway on http://127.0.0.1:54321 that answers like a hosted project does.
# It never talks to the live Layakari project.
#
#   scripts/local-supabase.sh up      start everything, apply migrations and seed data
#   scripts/local-supabase.sh reset   wipe the database and start again
#   scripts/local-supabase.sh down    stop everything
#   scripts/local-supabase.sh env     print the env vars the app needs
set -euo pipefail

HERE="$(cd "$(dirname "$0")/.." && pwd)"
STATE="${LOCAL_SUPABASE_DIR:-/var/tmp/layakari-supabase}"
CACHE="${LOCAL_SUPABASE_CACHE:-$HOME/.cache/layakari-supabase}"
PG_BIN="${PG_BIN:-$( (pg_config --bindir 2>/dev/null) || echo /usr/lib/postgresql/16/bin)}"
[ -x "$PG_BIN/initdb" ] || PG_BIN="$(ls -d /usr/lib/postgresql/*/bin | sort -V | tail -1)"
PG_PORT=54322 AUTH_PORT=9999 REST_PORT=3001 GATEWAY_PORT=54321
POSTGREST_VERSION=v12.2.3
AUTH_VERSION=v2.177.0
JWT_SECRET="super-secret-jwt-token-with-at-least-32-characters-long"
PSQL=(psql -v ON_ERROR_STOP=1 -q -h 127.0.0.1 -p "$PG_PORT" -U postgres -d postgres)

as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }

jwt() { # role, sign an HS256 token that never expires (local only)
  node -e '
    const c=require("crypto"),b=o=>Buffer.from(JSON.stringify(o)).toString("base64url");
    const h=b({alg:"HS256",typ:"JWT"}),p=b({iss:"supabase-local",role:process.argv[1],iat:1700000000,exp:4102444800});
    process.stdout.write(h+"."+p+"."+c.createHmac("sha256",process.argv[2]).update(h+"."+p).digest("base64url"));
  ' "$1" "$JWT_SECRET"
}

fetch_bins() {
  mkdir -p "$CACHE"
  if [ ! -x "$CACHE/postgrest" ]; then
    curl -fsSL "https://github.com/PostgREST/postgrest/releases/download/$POSTGREST_VERSION/postgrest-$POSTGREST_VERSION-linux-static-x64.tar.xz" | tar -xJ -C "$CACHE"
  fi
  if [ ! -x "$CACHE/auth/auth" ]; then
    mkdir -p "$CACHE/auth"
    curl -fsSL "https://github.com/supabase/auth/releases/download/$AUTH_VERSION/auth-$AUTH_VERSION-x86.tar.gz" | tar -xz -C "$CACHE/auth"
  fi
}

wait_for() { # url
  for _ in $(seq 1 60); do curl -fs -o /dev/null "$1" && return 0; sleep 0.5; done
  echo "timed out waiting for $1" >&2; return 1
}

start_bg() { # name, command...
  local name=$1; shift
  nohup "$@" >"$STATE/$name.log" 2>&1 &
  echo $! >"$STATE/$name.pid"
}

stop_bg() { [ -f "$STATE/$1.pid" ] && kill "$(cat "$STATE/$1.pid")" 2>/dev/null || true; rm -f "$STATE/$1.pid"; }

down() {
  for s in gateway postgrest auth; do stop_bg $s; done
  if [ -d "$STATE/data" ]; then as_pg "'$PG_BIN/pg_ctl' -D '$STATE/data' -m fast stop" >/dev/null 2>&1 || true; fi
}

up() {
  down # restart cleanly if it's already running
  fetch_bins
  mkdir -p "$STATE"
  local fresh=0
  if [ ! -d "$STATE/data" ]; then
    fresh=1
    [ "$(id -u)" = 0 ] && chown postgres "$STATE"
    as_pg "'$PG_BIN/initdb' -D '$STATE/data' -U postgres --auth=trust" >/dev/null
  fi
  as_pg "'$PG_BIN/pg_ctl' -D '$STATE/data' -o '-p $PG_PORT -k /tmp' -l '$STATE/data/postgres.log' -w start" >/dev/null
  "${PSQL[@]}" -f "$HERE/supabase/local/roles.sql"

  start_bg auth env GOTRUE_DB_DRIVER=postgres \
    DATABASE_URL="postgres://supabase_auth_admin:auth@127.0.0.1:$PG_PORT/postgres?sslmode=disable" \
    GOTRUE_DB_MIGRATIONS_PATH="$CACHE/auth/migrations" \
    API_EXTERNAL_URL="http://127.0.0.1:$GATEWAY_PORT/auth/v1" GOTRUE_API_HOST=127.0.0.1 PORT=$AUTH_PORT \
    GOTRUE_SITE_URL="${SITE_URL:-http://localhost:3000}" GOTRUE_URI_ALLOW_LIST="*" \
    GOTRUE_JWT_SECRET="$JWT_SECRET" GOTRUE_JWT_EXP=3600 GOTRUE_JWT_AUD=authenticated GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated \
    GOTRUE_JWT_ADMIN_ROLES=service_role GOTRUE_DISABLE_SIGNUP=false GOTRUE_EXTERNAL_EMAIL_ENABLED=true \
    GOTRUE_MAILER_AUTOCONFIRM=true GOTRUE_SMTP_HOST=localhost GOTRUE_SMTP_PORT=2500 GOTRUE_SMTP_ADMIN_EMAIL=admin@example.com \
    GOTRUE_RATE_LIMIT_EMAIL_SENT=1000 GOTRUE_LOG_LEVEL=warn \
    "$CACHE/auth/auth"
  wait_for "http://127.0.0.1:$AUTH_PORT/health"

  # Migrations and seed run once, on a new database. `reset` starts again from scratch.
  if [ "$fresh" = 1 ]; then
    for f in "$HERE"/supabase/migrations/*.sql; do "${PSQL[@]}" -f "$f"; done
    if [ "${SEED:-1}" = 1 ]; then "${PSQL[@]}" -f "$HERE/supabase/seed.sql"; fi
  fi

  cat >"$STATE/postgrest.conf" <<EOF
db-uri = "postgres://authenticator:authenticator@127.0.0.1:$PG_PORT/postgres"
db-schemas = "public"
db-anon-role = "anon"
jwt-secret = "$JWT_SECRET"
server-host = "127.0.0.1"
server-port = $REST_PORT
db-channel-enabled = true
EOF
  start_bg postgrest "$CACHE/postgrest" "$STATE/postgrest.conf"
  start_bg gateway env GATEWAY_PORT=$GATEWAY_PORT AUTH_PORT=$AUTH_PORT REST_PORT=$REST_PORT node "$HERE/scripts/local-gateway.mjs"
  wait_for "http://127.0.0.1:$GATEWAY_PORT/auth/v1/health"
  for _ in $(seq 1 40); do curl -fs -o /dev/null "http://127.0.0.1:$REST_PORT/" && break; sleep 0.5; done
  env_vars
}

env_vars() {
  echo "NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:$GATEWAY_PORT"
  echo "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$(jwt anon)"
  echo "LOCAL_SUPABASE_SERVICE_KEY=$(jwt service_role)"
  echo "LOCAL_DATABASE_URL=postgres://postgres@127.0.0.1:$PG_PORT/postgres"
}

case "${1:-up}" in
  up) up ;;
  down) down ;;
  reset) down; rm -rf "$STATE"; up ;;
  env) env_vars ;;
  *) echo "usage: $0 up|down|reset|env" >&2; exit 2 ;;
esac
