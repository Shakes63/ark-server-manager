import { ServerState } from "@ark/shared";
import clsx from "clsx";

const STYLES: Record<ServerState, string> = {
  [ServerState.Running]: "bg-green-500/15 text-green-400 border-green-500/30",
  [ServerState.Starting]: "bg-sky-500/15 text-sky-400 border-sky-500/30 animate-pulse",
  [ServerState.Stopping]: "bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse",
  [ServerState.Stopped]: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  [ServerState.Installing]: "bg-sky-500/15 text-sky-400 border-sky-500/30 animate-pulse",
  [ServerState.Updating]: "bg-sky-500/15 text-sky-400 border-sky-500/30 animate-pulse",
  [ServerState.Crashed]: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function StateBadge({ state }: { state: ServerState }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STYLES[state],
      )}
    >
      {state}
    </span>
  );
}
