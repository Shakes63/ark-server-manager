#!/usr/bin/env bash
# Manager-contract entrypoint for ASE servers (native Linux binary).
set -euo pipefail

: "${PUID:=99}" "${PGID:=100}"
chown -R "$PUID:$PGID" /ark 2>/dev/null || true

if [ "${1:-}" = "steamcmd" ]; then
  exec "$@"
fi

echo "[ase] launching: ShooterGameServer $*"
exec "${ARK_SERVER_EXE}" "$@"
