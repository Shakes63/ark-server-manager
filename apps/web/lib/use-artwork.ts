"use client";
import { useEffect, useState } from "react";
import type { Game, GameArtwork } from "@ark/shared";
import { apiGet } from "@/lib/api";

type ArtworkMap = Partial<Record<Game, GameArtwork>>;

// Module-level cache: art is per-game and effectively static, so one fetch per
// page life serves every card/banner without re-requesting on navigation.
let cached: ArtworkMap | null = null;
let inflight: Promise<ArtworkMap> | null = null;

/** Per-game SteamGridDB art (empty map until fetched / when no key is set). */
export function useArtwork(): ArtworkMap {
  const [art, setArt] = useState<ArtworkMap>(cached ?? {});
  useEffect(() => {
    if (cached) return;
    inflight ??= apiGet<ArtworkMap>("/artwork").then((m) => (cached = m));
    inflight.then(setArt).catch(() => undefined);
  }, []);
  return art;
}
