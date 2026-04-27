#!/usr/bin/env bash
# =============================================================================
# AIScreener — Local Development Startup Script
# Usage:
#   bash scripts/dev.sh            — check config + start everything
#   bash scripts/dev.sh --check    — run checks only, don't start
#   bash scripts/dev.sh --no-celery — skip Celery worker/beat
# =============================================================================

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$REPO_ROOT/apps/api"
WEB_DIR="$REPO_ROOT/apps/web"
CANDIDATE_DIR="$REPO_ROOT/apps/candidate"

CHECK_ONLY=false
NO_CELERY=false
for arg in "$@"; do
  case $arg in
    --check)    CHECK_ONLY=true ;;
    --no-celery) NO_CELERY=true ;;
  esac
done

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Helpers ───────────────────────────────────────────────────────────────────
ok()   { echo -e "  ${GREEN}✓${RESET}  $1"; }
fail() { echo -e "  ${RED}✗${RESET}  $1"; ERRORS=$((ERRORS + 1)); }
warn() { echo -e "  ${YELLOW}!${RESET}  $1"; }
info() { echo -e "  ${CYAN}→${RESET}  $1"; }
section() { echo -e "\n${BOLD}${BLUE}▸ $1${RESET}"; }

ERRORS=0

# ── PID tracking for cleanup ─────────────────────────────────────────────────
PIDS=()
cleanup() {
  echo -e "\n${YELLOW}Shutting down all processes...${RESET}"
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
  echo -e "${GREEN}All processes stopped.${RESET}"
  exit 0
}
trap cleanup SIGINT SIGTERM

# =============================================================================
# SECTION 1 — Prerequisites (installed tools)
# =============================================================================
check_prerequisites() {
  section "Prerequisites"

  # Python >= 3.12
  if command -v python3 &>/dev/null; then
    PY_VER=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    PY_MAJOR=$(echo "$PY_VER" | cut -d. -f1)
    PY_MINOR=$(echo "$PY_VER" | cut -d. -f2)
    if [[ $PY_MAJOR -ge 3 && $PY_MINOR -ge 12 ]]; then
      ok "Python $PY_VER"
    else
      fail "Python $PY_VER found — need >= 3.12  (install via pyenv: pyenv install 3.12)"
    fi
  else
    fail "Python3 not found  →  brew install python@3.12"
  fi

  # uv (preferred) or pip
  if command -v uv &>/dev/null; then
    ok "uv $(uv --version | awk '{print $2}')"
    PYTHON_INSTALLER="uv"
  elif command -v pip3 &>/dev/null; then
    warn "uv not found — falling back to pip3  (install uv: curl -LsSf https://astral.sh/uv/install.sh | sh)"
    PYTHON_INSTALLER="pip"
  else
    fail "Neither uv nor pip3 found"
    PYTHON_INSTALLER="none"
  fi
  export PYTHON_INSTALLER

  # Node >= 20
  if command -v node &>/dev/null; then
    NODE_VER=$(node --version | tr -d 'v')
    NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
    if [[ $NODE_MAJOR -ge 20 ]]; then
      ok "Node.js v$NODE_VER"
    else
      fail "Node.js v$NODE_VER found — need >= 20  (install via nvm: nvm install 20)"
    fi
  else
    fail "Node.js not found  →  nvm install 20"
  fi

  # pnpm
  if command -v pnpm &>/dev/null; then
    ok "pnpm $(pnpm --version)"
  else
    fail "pnpm not found  →  npm install -g pnpm"
  fi

  # openssl (for key generation)
  if command -v openssl &>/dev/null; then
    ok "openssl $(openssl version | awk '{print $2}')"
  else
    warn "openssl not found — JWT key generation will fail  →  brew install openssl"
  fi
}

# =============================================================================
# SECTION 2 — Services (Postgres + Redis)
# =============================================================================
check_services() {
  section "Services (Postgres & Redis)"

  # PostgreSQL
  if command -v pg_isready &>/dev/null; then
    if pg_isready -h localhost -p 5432 -q; then
      ok "PostgreSQL is running on localhost:5432"
    else
      fail "PostgreSQL is NOT running on localhost:5432\n     Start it:  brew services start postgresql@16"
    fi
  else
    # Fall back to psql
    if psql -h localhost -p 5432 -U aiscreener -d aiscreener -c "SELECT 1" &>/dev/null 2>&1; then
      ok "PostgreSQL is running on localhost:5432"
    else
      fail "Cannot reach PostgreSQL on localhost:5432\n     Start it:  brew services start postgresql@16"
    fi
  fi

  # Redis
  if command -v redis-cli &>/dev/null; then
    if redis-cli -h localhost -p 6379 ping 2>/dev/null | grep -q "PONG"; then
      ok "Redis is running on localhost:6379"
    else
      fail "Redis is NOT running on localhost:6379\n     Start it:  brew services start redis"
    fi
  else
    fail "redis-cli not found — cannot check Redis  →  brew install redis"
  fi
}

# =============================================================================
# SECTION 3 — Environment file
# =============================================================================
check_env() {
  section "Environment Configuration (apps/api/.env)"

  local ENV_FILE="$API_DIR/.env"

  # .env file exists
  if [[ -f "$ENV_FILE" ]]; then
    ok ".env file exists"
  else
    warn ".env not found — creating from .env.example"
    if [[ -f "$API_DIR/.env.example" ]]; then
      cp "$API_DIR/.env.example" "$ENV_FILE"
      info "Created $ENV_FILE — fill in the required values below"
    else
      fail ".env.example not found either — cannot create .env"
      return
    fi
  fi

  # Source the env file (ignore lines that fail expansion)
  set +u
  # shellcheck disable=SC1090
  while IFS= read -r line; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue
    export "${line?}" 2>/dev/null || true
  done < <(grep -v '^#' "$ENV_FILE" | grep '=')
  set -u

  # Required vars — check each is set and non-empty
  local required_vars=(
    "DATABASE_URL"
    "REDIS_URL"
    "JWT_SECRET_KEY"
    "JWT_PUBLIC_KEY"
    "JWT_ALGORITHM"
    "JWT_ACCESS_TOKEN_EXPIRE_MINUTES"
    "JWT_REFRESH_TOKEN_EXPIRE_DAYS"
    "MFA_TOTP_SECRET_ENCRYPTION_KEY"
  )

  local missing=()
  for var in "${required_vars[@]}"; do
    val="${!var:-}"
    if [[ -z "$val" ]]; then
      missing+=("$var")
      fail "$var is not set"
    else
      # Truncate long values (keys) for display
      display="${val:0:40}"
      [[ ${#val} -gt 40 ]] && display="${display}…"
      ok "$var = $display"
    fi
  done

  # Hint for missing JWT keys
  if printf '%s\n' "${missing[@]:-}" | grep -q "JWT_SECRET_KEY\|JWT_PUBLIC_KEY"; then
    warn "JWT keys missing — generate them with:  bash scripts/gen-jwt-keys.sh"
  fi

  # Hint for missing MFA key
  if printf '%s\n' "${missing[@]:-}" | grep -q "MFA_TOTP_SECRET_ENCRYPTION_KEY"; then
    warn "MFA key missing — generate one with:"
    warn "  python3 -c \"import secrets; print('MFA_TOTP_SECRET_ENCRYPTION_KEY=' + secrets.token_hex(32))\""
    warn "  Then paste the output into apps/api/.env"
  fi

}

# =============================================================================
# SECTION 4 — Database user + database (auto-create if missing)
# =============================================================================
setup_database() {
  section "Database Setup"

  # Parse DATABASE_URL → postgresql+asyncpg://user:pass@host:port/dbname
  local DB_URL="${DATABASE_URL:-postgresql+asyncpg://aiscreener:aiscreener@localhost:5432/aiscreener}"
  local DB_USER DB_PASS DB_HOST DB_PORT DB_NAME

  DB_USER=$(echo "$DB_URL" | sed -E 's|.*//([^:]+):.*|\1|')
  DB_PASS=$(echo "$DB_URL" | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')
  DB_HOST=$(echo "$DB_URL" | sed -E 's|.*@([^:/]+).*|\1|')
  DB_PORT=$(echo "$DB_URL" | sed -E 's|.*:([0-9]+)/[^/].*|\1|')
  DB_NAME=$(echo "$DB_URL" | sed -E 's|.*/([^?]+)(\?.*)?$|\1|')

  # ── Role ────────────────────────────────────────────────────────────────────
  if psql -h "$DB_HOST" -p "$DB_PORT" postgres \
       -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null | grep -q 1; then
    ok "PostgreSQL role '$DB_USER' already exists"
  else
    info "Creating PostgreSQL role '$DB_USER'..."
    if psql -h "$DB_HOST" -p "$DB_PORT" postgres \
         -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>&1; then
      ok "Role '$DB_USER' created"
    else
      fail "Could not create role '$DB_USER' — are you connecting as a superuser?\n     Run manually:  psql postgres -c \"CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';\""
    fi
  fi

  # ── Database ─────────────────────────────────────────────────────────────────
  if psql -h "$DB_HOST" -p "$DB_PORT" postgres \
       -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null | grep -q 1; then
    ok "Database '$DB_NAME' already exists"
  else
    info "Creating database '$DB_NAME'..."
    if psql -h "$DB_HOST" -p "$DB_PORT" postgres \
         -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>&1; then
      ok "Database '$DB_NAME' created"
    else
      fail "Could not create database '$DB_NAME'\n     Run manually:  psql postgres -c \"CREATE DATABASE $DB_NAME OWNER $DB_USER;\""
    fi
  fi

  # ── Final connectivity check ─────────────────────────────────────────────────
  if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" \
       -c "SELECT 1" &>/dev/null 2>&1; then
    ok "Connected to '$DB_NAME' as '$DB_USER' on $DB_HOST:$DB_PORT"
  else
    fail "Still cannot connect to '$DB_NAME' as '$DB_USER' — check password in apps/api/.env"
  fi
}

# =============================================================================
# SECTION 5 — Python environment
# =============================================================================
check_python_setup() {
  section "Python Environment"

  local VENV="$API_DIR/.venv"

  # Virtual environment
  if [[ -d "$VENV" ]]; then
    ok "Virtual environment exists at apps/api/.venv"
  else
    warn "Virtual environment not found — creating it now"
    if [[ "$PYTHON_INSTALLER" == "uv" ]]; then
      uv venv "$VENV" --python 3.12 2>&1 | sed 's/^/     /'
    else
      python3 -m venv "$VENV" 2>&1 | sed 's/^/     /'
    fi
    ok "Virtual environment created"
  fi

  # Activate
  # shellcheck disable=SC1091
  source "$VENV/bin/activate"

  # Dependencies installed (check for fastapi as a proxy)
  if python -c "import fastapi" &>/dev/null 2>&1; then
    ok "Python dependencies are installed"
  else
    info "Installing Python dependencies..."
    if [[ "$PYTHON_INSTALLER" == "uv" ]]; then
      uv pip install -e "$API_DIR[dev]" 2>&1 | tail -5 | sed 's/^/     /'
    else
      pip install -e "$API_DIR[dev]" -q 2>&1 | tail -5 | sed 's/^/     /'
    fi
    ok "Python dependencies installed"
  fi
}

# =============================================================================
# SECTION 6 — Database migrations
# =============================================================================
check_migrations() {
  section "Database Migrations"

  # Must be run from api dir with venv active
  cd "$API_DIR"

  # Get current revision
  CURRENT=$(alembic current 2>/dev/null | grep -oE '\([a-z]+\)' | head -1 || echo "(none)")
  HEAD=$(alembic heads 2>/dev/null | grep -oE '^[a-f0-9]+' | head -1 || echo "unknown")

  if alembic current 2>/dev/null | grep -q "(head)"; then
    ok "Migrations are up to date  [$HEAD]"
  else
    warn "Migrations are not at head (current: $CURRENT) — running alembic upgrade head"
    alembic upgrade head 2>&1 | sed 's/^/     /'
    ok "Migrations applied"
  fi

  cd "$REPO_ROOT"
}

# =============================================================================
# SECTION 7 — Node / pnpm setup
# =============================================================================
check_node_setup() {
  section "Node.js / pnpm"

  local NM="$REPO_ROOT/node_modules"
  local SHARED_NM="$REPO_ROOT/packages/shared-types/node_modules"

  if [[ -d "$NM" && -d "$SHARED_NM" ]]; then
    ok "node_modules present"
  else
    info "Installing node dependencies via pnpm..."
    cd "$REPO_ROOT"
    pnpm install 2>&1 | tail -5 | sed 's/^/     /'
    ok "Node dependencies installed"
  fi

  # Build shared-types so apps can import from it
  if [[ -d "$REPO_ROOT/packages/shared-types/dist" ]]; then
    ok "shared-types package is built"
  else
    info "Building @aiscreener/shared-types..."
    cd "$REPO_ROOT/packages/shared-types"
    pnpm build 2>&1 | tail -3 | sed 's/^/     /'
    ok "shared-types built"
    cd "$REPO_ROOT"
  fi
}

# =============================================================================
# SECTION 8 — Start all processes
# =============================================================================
start_services() {
  section "Starting Services"

  LOG_DIR="$REPO_ROOT/.logs"
  mkdir -p "$LOG_DIR"

  # ── Kill any stale processes on our ports ─────────────────────────────────
  for port in 8000 3000 3001; do
    pids=$(lsof -ti ":$port" 2>/dev/null) || true
    if [[ -n "$pids" ]]; then
      info "Freeing port $port (killing PID $pids)"
      echo "$pids" | xargs kill -9 2>/dev/null || true
    fi
  done

  # Activate Python venv
  # shellcheck disable=SC1091
  source "$API_DIR/.venv/bin/activate"

  # ── FastAPI (auto-reloads on .py changes) ────────────────────────────────
  info "Starting FastAPI on http://localhost:8000"
  cd "$API_DIR"
  uvicorn main:socket_app --host 0.0.0.0 --port 8000 --reload \
    > >(sed "s/^/[33m[api][0m /" >> "$LOG_DIR/api.log") \
    2> >(sed "s/^/[33m[api][0m /" >> "$LOG_DIR/api.log") &
  API_PID=$!; PIDS+=($API_PID)
  ok "FastAPI started  (PID $API_PID)  — auto-reloads on .py changes"
  cd "$REPO_ROOT"

  # ── Celery worker ─────────────────────────────────────────────────────────
  if [[ "$NO_CELERY" == false ]]; then
    info "Starting Celery worker"
    cd "$API_DIR"
    celery -A app.celery_app.celery worker --loglevel=info \
      > "$LOG_DIR/celery-worker.log" 2>&1 &
    WORKER_PID=$!; PIDS+=($WORKER_PID)
    ok "Celery worker started  (PID $WORKER_PID)  →  logs: .logs/celery-worker.log"

    info "Starting Celery beat scheduler"
    celery -A app.celery_app.celery beat --loglevel=info \
      > "$LOG_DIR/celery-beat.log" 2>&1 &
    BEAT_PID=$!; PIDS+=($BEAT_PID)
    ok "Celery beat started  (PID $BEAT_PID)  →  logs: .logs/celery-beat.log"
    cd "$REPO_ROOT"
  else
    warn "Celery skipped (--no-celery flag)"
  fi

  # ── Web app (Vite HMR — browser auto-updates on file changes) ─────────────
  info "Starting web app on http://localhost:3000"
  cd "$WEB_DIR"
  pnpm dev > "$LOG_DIR/web.log" 2>&1 &
  WEB_PID=$!; PIDS+=($WEB_PID)
  ok "Web app started  (PID $WEB_PID)  — Vite HMR active, browser updates instantly"
  cd "$REPO_ROOT"

  # ── Candidate app ─────────────────────────────────────────────────────────
  info "Starting candidate app on http://localhost:3001"
  cd "$CANDIDATE_DIR"
  pnpm dev > "$LOG_DIR/candidate.log" 2>&1 &
  CAND_PID=$!; PIDS+=($CAND_PID)
  ok "Candidate app started  (PID $CAND_PID)  →  logs: .logs/candidate.log"
  cd "$REPO_ROOT"
}

# =============================================================================
# Summary banner
# =============================================================================
print_summary() {
  echo -e "\n${BOLD}${GREEN}══════════════════════════════════════════${RESET}"
  echo -e "${BOLD}${GREEN}  AIScreener is running                   ${RESET}"
  echo -e "${BOLD}${GREEN}══════════════════════════════════════════${RESET}"
  echo -e "  API        →  ${CYAN}http://localhost:8000${RESET}"
  echo -e "  API docs   →  ${CYAN}http://localhost:8000/docs${RESET}"
  echo -e "  Web app    →  ${CYAN}http://localhost:3000${RESET}"
  echo -e "  Candidate  →  ${CYAN}http://localhost:3001${RESET}"
  echo -e ""
  echo -e "  Logs       →  ${CYAN}.logs/${RESET}"
  echo -e ""
  echo -e "  Press ${BOLD}Ctrl+C${RESET} to stop all processes"
  echo -e "${BOLD}${GREEN}══════════════════════════════════════════${RESET}\n"
}

# =============================================================================
# Main
# =============================================================================
echo -e "\n${BOLD}${BLUE}AIScreener — Development Environment Setup${RESET}"
echo -e "${BLUE}$(printf '─%.0s' {1..44})${RESET}"

check_prerequisites
check_services
check_env
setup_database
check_python_setup
check_migrations
check_node_setup

# ── Abort if any checks failed ────────────────────────────────────────────────
if [[ $ERRORS -gt 0 ]]; then
  echo -e "\n${RED}${BOLD}✗  $ERRORS check(s) failed — fix the issues above before starting.${RESET}\n"
  exit 1
fi

echo -e "\n${GREEN}${BOLD}✓  All checks passed${RESET}"

if [[ "$CHECK_ONLY" == true ]]; then
  echo -e "${GREEN}  (--check mode — not starting services)${RESET}\n"
  exit 0
fi

start_services
print_summary

echo -e "${CYAN}Streaming logs (Ctrl+C to stop all services):${RESET}\n"
# Stream all logs live — tail -f keeps the terminal active AND fires the trap on Ctrl+C
tail -f "$REPO_ROOT/.logs/api.log" "$REPO_ROOT/.logs/web.log" &
TAIL_PID=$!; PIDS+=($TAIL_PID)

wait
