#!/usr/bin/env sh
set -eu

ACTION="${1:-status}"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_DIR="$ROOT_DIR/.tmp"
PID_FILE="$PID_DIR/ssh-tunnel.pid"
LOG_FILE="$PID_DIR/ssh-tunnel.log"

mkdir -p "$PID_DIR"

if [ -f "$ROOT_DIR/.env.local" ]; then
  ENV_FILE="$ROOT_DIR/.env.local"
elif [ -f "$ROOT_DIR/.env" ]; then
  ENV_FILE="$ROOT_DIR/.env"
else
  echo "Missing .env or .env.local"
  exit 1
fi

# shellcheck disable=SC1090
set -a
. "$ENV_FILE"
set +a

require_var() {
  var_name="$1"
  eval "var_value=\${$var_name:-}"
  if [ -z "${var_value}" ]; then
    echo "Missing required env: $var_name"
    exit 1
  fi
}

require_var VPS_HOST
require_var VPS_USER

VPS_PORT="${VPS_PORT:-22}"
LOCAL_DB_PORT="${LOCAL_DB_PORT:-15432}"
LOCAL_REDIS_PORT="${LOCAL_REDIS_PORT:-16379}"
REMOTE_DB_PORT="${REMOTE_DB_PORT:-5432}"
REMOTE_REDIS_PORT="${REMOTE_REDIS_PORT:-6379}"
REMOTE_DB_HOST="${REMOTE_DB_HOST:-127.0.0.1}"
REMOTE_REDIS_HOST="${REMOTE_REDIS_HOST:-127.0.0.1}"
VPS_SSH_KEY_PATH="${VPS_SSH_KEY_PATH:-}"
TUNNEL_USE_DOCKER_IP="${TUNNEL_USE_DOCKER_IP:-true}"
DB_CONTAINER_NAME="${DB_CONTAINER_NAME:-bunn-postgres}"
REDIS_CONTAINER_NAME="${REDIS_CONTAINER_NAME:-bunn-redis}"

build_ssh_base_args() {
  args="-p ${VPS_PORT} -o BatchMode=yes -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -o ServerAliveCountMax=3"
  if [ -n "$VPS_SSH_KEY_PATH" ]; then
    args="$args -i $VPS_SSH_KEY_PATH"
  fi
  echo "$args"
}

SSH_BASE_ARGS="$(build_ssh_base_args)"

is_safe_name() {
  case "$1" in
    *[!a-zA-Z0-9._-]* | "")
      return 1
      ;;
    *)
      return 0
      ;;
  esac
}

resolve_container_ip() {
  container_name="$1"
  if ! is_safe_name "$container_name"; then
    echo ""
    return 1
  fi

  inspect_cmd="docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${container_name} 2>/dev/null || true"
  ip="$(sh -c "ssh $SSH_BASE_ARGS ${VPS_USER}@${VPS_HOST} \"$inspect_cmd\"" 2>/dev/null | tr -d '\r' | awk 'NF {print $0}' | tail -n 1)"
  if [ -z "$ip" ]; then
    echo ""
    return 1
  fi
  echo "$ip"
}

is_running() {
  if [ ! -f "$PID_FILE" ]; then
    return 1
  fi
  pid="$(cat "$PID_FILE")"
  if [ -z "$pid" ]; then
    return 1
  fi
  if kill -0 "$pid" 2>/dev/null; then
    return 0
  fi
  rm -f "$PID_FILE"
  return 1
}

case "$ACTION" in
  up)
    if is_running; then
      echo "SSH tunnel already running (pid: $(cat "$PID_FILE"))"
      exit 0
    fi

    db_target_host="$REMOTE_DB_HOST"
    redis_target_host="$REMOTE_REDIS_HOST"
    if [ "$TUNNEL_USE_DOCKER_IP" = "true" ]; then
      db_ip="$(resolve_container_ip "$DB_CONTAINER_NAME" || true)"
      redis_ip="$(resolve_container_ip "$REDIS_CONTAINER_NAME" || true)"
      if [ -n "$db_ip" ]; then
        db_target_host="$db_ip"
      else
        echo "Warn: failed to resolve container IP for $DB_CONTAINER_NAME, fallback to $db_target_host"
      fi
      if [ -n "$redis_ip" ]; then
        redis_target_host="$redis_ip"
      else
        echo "Warn: failed to resolve container IP for $REDIS_CONTAINER_NAME, fallback to $redis_target_host"
      fi
    fi

    ssh_tunnel_args="-N $SSH_BASE_ARGS -L ${LOCAL_DB_PORT}:${db_target_host}:${REMOTE_DB_PORT} -L ${LOCAL_REDIS_PORT}:${redis_target_host}:${REMOTE_REDIS_PORT}"
    sh -c "ssh $ssh_tunnel_args ${VPS_USER}@${VPS_HOST}" >"$LOG_FILE" 2>&1 &
    echo "$!" > "$PID_FILE"
    sleep 1
    if is_running; then
      echo "SSH tunnel started (pid: $(cat "$PID_FILE"))"
      echo "DB: 127.0.0.1:${LOCAL_DB_PORT} -> ${db_target_host}:${REMOTE_DB_PORT}"
      echo "Redis: 127.0.0.1:${LOCAL_REDIS_PORT} -> ${redis_target_host}:${REMOTE_REDIS_PORT}"
      exit 0
    fi
    echo "Failed to start SSH tunnel. Check: $LOG_FILE"
    exit 1
    ;;
  down)
    if is_running; then
      pid="$(cat "$PID_FILE")"
      kill "$pid" || true
      rm -f "$PID_FILE"
      echo "SSH tunnel stopped"
      exit 0
    fi
    echo "SSH tunnel is not running"
    exit 0
    ;;
  status)
    if is_running; then
      echo "SSH tunnel running (pid: $(cat "$PID_FILE"))"
      exit 0
    fi
    echo "SSH tunnel not running"
    exit 0
    ;;
  *)
    echo "Usage: ./scripts/ssh-tunnel.sh [up|down|status]"
    exit 1
    ;;
esac
