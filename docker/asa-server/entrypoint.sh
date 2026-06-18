#!/usr/bin/env bash
# Manager-contract entrypoint for ASA servers.
#   - When CMD is `steamcmd ...` (ephemeral installer) we just exec it.
#   - Otherwise CMD is the assembled ARK launch argv; we run the server exe under
#     Proton with those args.
set -euo pipefail

# Fix ownership of mounted volumes for the unprivileged user (Unraid 99:100).
: "${PUID:=99}" "${PGID:=100}"
if command -v groupmod >/dev/null 2>&1; then
  groupmod -o -g "$PGID" steam 2>/dev/null || true
  usermod -o -u "$PUID" steam 2>/dev/null || true
fi
chown -R "$PUID:$PGID" /ark 2>/dev/null || true

# Installer path: run SteamCMD verbatim.
if [ "${1:-}" = "steamcmd" ]; then
  exec "$@"
fi

# Server path: launch ARK under Proton with the manager-provided args.
# GE-Proton env (STEAM_COMPAT_*) is provided by the base image.
echo "[asa] launching: ArkAscendedServer.exe $*"
exec proton run "${ARK_SERVER_EXE}" "$@"
