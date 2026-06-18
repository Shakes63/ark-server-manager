# ── ASA game-server image ───────────────────────────────────────────────────
# Built FROM a proven community ASA base (GE-Proton + SteamCMD layer) so we don't
# own the Proton/Wine plumbing (PLANNING.md → Base image decision). We add only
# the manager-contract entrypoint that:
#   - drops to PUID/PGID
#   - accepts the assembled ARK launch argv as CMD
#   - runs SteamCMD when invoked as the ephemeral installer
#
# TODO(Phase 1): pin the exact base image tag and verify the Proton invocation +
# install paths against a real host (cannot be exercised in this environment).
ARG ASA_BASE=mschnitzer/ark-survival-ascended-server:latest
FROM ${ASA_BASE}

COPY docker/asa-server/entrypoint.sh /usr/local/bin/ark-entrypoint.sh
RUN chmod +x /usr/local/bin/ark-entrypoint.sh

ENV ARK_INSTALL_DIR=/ark/server \
    ARK_SERVER_EXE=/ark/server/ShooterGame/Binaries/Win64/ArkAscendedServer.exe

ENTRYPOINT ["/usr/local/bin/ark-entrypoint.sh"]
