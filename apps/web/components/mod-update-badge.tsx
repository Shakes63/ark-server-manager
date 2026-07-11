import { Puzzle } from "lucide-react";

/** Shown when an installed mod (Valheim/Thunderstore or a pinned Minecraft modpack)
 *  has a newer version available. Update from the server's Mods tab. */
export function ModUpdateBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="A mod update is available — open the Mods tab to update, then restart to load it"
      className={`inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 text-xs font-medium text-sky-300 ${className}`}
    >
      <Puzzle className="h-3.5 w-3.5" /> Mod update
    </span>
  );
}
