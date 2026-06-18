# ── Manager image (web + API in one lean container) ─────────────────────────
# Deliberately contains NO game runtime (no Proton/SteamCMD) — game files run in
# separate containers (PLANNING.md → "Keep the manager image lean").
FROM node:20-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
# openssl + ca-certificates are required by Prisma's query/schema engines (the
# slim image omits them, which otherwise breaks `prisma migrate deploy` on boot).
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# --- deps: install with the lockfile for reproducibility ---
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile || pnpm install

# --- build ---
FROM deps AS build
COPY . .
RUN pnpm --filter @ark/api build \
  && pnpm --filter @ark/web build

# --- runtime ---
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000 8787
# gosu + tini would be added here for PUID/PGID drop + signal handling.
CMD ["bash", "docker/start.sh"]
