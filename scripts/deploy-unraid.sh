#!/bin/bash
# Redeploy Palisade on an Unraid box over SSH — pull the latest image and
# recreate the container with the SAME env/labels/mounts it already has.
#
# Usage: scripts/deploy-unraid.sh [ssh-host]   (default: tower)
#
# Secrets never touch disk: the current container's env is piped straight into
# `docker run --env-file /dev/stdin` (no /tmp file to leak on a crash).
#
# When a docker-socket proxy container (PROXY_NAME) exists, the manager is
# attached to the proxy network and pointed at it via DOCKER_HOST — the raw
# /var/run/docker.sock is NOT mounted. Without a proxy it falls back to the
# classic socket mount.
set -euo pipefail

HOST="${1:-tower}"
NAME="Palisade"
IMAGE="ghcr.io/shakes63/palisade:latest"
PROXY_NAME="palisade-docker-proxy"
PROXY_NET="palisade-proxy"

ssh "$HOST" bash -s <<EOF
set -euo pipefail
docker pull $IMAGE >/dev/null
echo "pulled \$(docker image inspect $IMAGE --format '{{index .RepoDigests 0}}')"

# Snapshot the current env (minus any stale DOCKER_HOST — re-derived below).
ENV_CONTENT=\$(docker inspect $NAME --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -v '^DOCKER_HOST=')

USE_PROXY=0
if docker inspect $PROXY_NAME >/dev/null 2>&1; then USE_PROXY=1; fi

docker stop $NAME >/dev/null
docker rm $NAME >/dev/null

ARGS=(
  --name $NAME
  --network ark-net
  -p 8970:3000
  --add-host host.docker.internal:host-gateway
  -v /mnt/cache/appdata/ark-manager:/data:rw
  -l net.unraid.docker.icon=https://raw.githubusercontent.com/Shakes63/palisade/main/unraid/palisade-icon.png
  -l net.unraid.docker.managed=dockerman
  -l 'net.unraid.docker.webui=http://[IP]:[PORT:3000]/'
  --restart unless-stopped
  --env-file /dev/stdin
)
if [ "\$USE_PROXY" = "1" ]; then
  ARGS+=( -e DOCKER_HOST=tcp://$PROXY_NAME:2375 )
else
  ARGS+=( -e DOCKER_HOST=unix:///var/run/docker.sock -v /var/run/docker.sock:/var/run/docker.sock:rw )
fi

# create → attach proxy net → start, so DOCKER_HOST is reachable the moment the API boots
printf '%s\n' "\$ENV_CONTENT" | docker create "\${ARGS[@]}" $IMAGE >/dev/null
if [ "\$USE_PROXY" = "1" ]; then docker network connect $PROXY_NET $NAME; fi
docker start $NAME >/dev/null

sleep 8
docker logs $NAME 2>&1 | grep -m1 listening
EOF
