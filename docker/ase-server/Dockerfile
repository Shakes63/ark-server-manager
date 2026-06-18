# ── ASE game-server image (Phase 4) ─────────────────────────────────────────
# ASE has a NATIVE Linux dedicated server, so this is much simpler than ASA:
# SteamCMD + the native binary, no Proton.
FROM cm2network/steamcmd:root

COPY docker/ase-server/entrypoint.sh /usr/local/bin/ark-entrypoint.sh
RUN chmod +x /usr/local/bin/ark-entrypoint.sh

ENV ARK_INSTALL_DIR=/ark/server \
    ARK_SERVER_EXE=/ark/server/ShooterGame/Binaries/Linux/ShooterGameServer

ENTRYPOINT ["/usr/local/bin/ark-entrypoint.sh"]
