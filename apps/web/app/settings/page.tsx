"use client";
import { useEffect, useMemo, useState } from "react";
import { Save, KeyRound, Send, CheckCircle2, Circle } from "lucide-react";
import { apiGet, apiPatch, apiPost } from "@/lib/api";

/** The browser's best guess at the user's IANA timezone (falls back to UTC). */
const detectZone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

type SettingsView = Record<string, string | boolean>;

export default function SettingsPage() {
  const [view, setView] = useState<SettingsView>({});
  const [timezone, setTimezone] = useState("");
  const [curseForgeApiKey, setCurseForgeApiKey] = useState("");
  const [steamWebApiKey, setSteamWebApiKey] = useState("");
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  const load = () => {
    apiGet<SettingsView>("/settings")
      .then((v) => {
        setView(v);
        // Pre-select the user's detected zone when nothing is saved yet, so they
        // rarely have to touch it.
        setTimezone(typeof v.timezone === "string" && v.timezone ? v.timezone : detectZone());
        if (typeof v.discord_webhook_url === "string") setDiscordWebhookUrl(v.discord_webhook_url);
      })
      .catch(() => undefined);
  };
  useEffect(load, []);

  const configured = (key: string) => view[key] === true || typeof view[key] === "string";

  const save = async () => {
    setBusy(true);
    setSaved(false);
    try {
      const settingsBody: Record<string, string> = {};
      if (timezone) settingsBody.timezone = timezone;
      if (curseForgeApiKey) settingsBody.curseForgeApiKey = curseForgeApiKey;
      if (steamWebApiKey) settingsBody.steamWebApiKey = steamWebApiKey;
      if (Object.keys(settingsBody).length) await apiPatch("/settings", settingsBody);
      await apiPatch("/notifications/webhook", { discordWebhookUrl });
      setCurseForgeApiKey("");
      setSteamWebApiKey("");
      setSaved(true);
      load();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const testWebhook = async () => {
    setTestMsg(null);
    try {
      const res = await apiPost<{ sent: boolean }>("/notifications/test");
      setTestMsg(res.sent ? "Test message sent ✓" : "No webhook configured — save one first.");
    } catch (err) {
      setTestMsg((err as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="flex items-center gap-2 text-xl font-semibold">
        <KeyRound className="h-5 w-5 text-ark-accent" /> Settings
      </h1>

      <div className="card space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ark-accent2">
          Mod browser API keys
        </h2>

        <SecretField
          label="CurseForge API key (ASA mod browser)"
          value={curseForgeApiKey}
          onChange={setCurseForgeApiKey}
          configured={configured("curseforge_api_key")}
        />
        <SecretField
          label="Steam Web API key (ASE Workshop browser)"
          value={steamWebApiKey}
          onChange={setSteamWebApiKey}
          configured={configured("steam_web_api_key")}
        />
      </div>

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ark-accent2">
          Notifications
        </h2>
        <div>
          <label className="label">Discord / generic webhook URL</label>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="https://discord.com/api/webhooks/…"
              value={discordWebhookUrl}
              onChange={(e) => setDiscordWebhookUrl(e.target.value)}
            />
            <button type="button" className="btn-secondary shrink-0" onClick={testWebhook}>
              <Send className="h-4 w-4" /> Test
            </button>
          </div>
          {testMsg && <p className="mt-2 text-sm text-slate-400">{testMsg}</p>}
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ark-accent2">General</h2>
        <div>
          <label className="label">Timezone (scheduler)</label>
          <TimezoneSelect value={timezone} onChange={setTimezone} />
          <p className="mt-1 text-xs text-slate-500">
            Used for schedule times. Defaults to this device&apos;s timezone.
          </p>
        </div>
      </div>

      <button className="btn-primary" onClick={save} disabled={busy}>
        <Save className="h-4 w-4" /> {busy ? "Saving…" : saved ? "Saved ✓" : "Save settings"}
      </button>
    </div>
  );
}

// A short fallback for runtimes without Intl.supportedValuesOf (very old browsers).
const FALLBACK_ZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
];

/** Dropdown of every IANA timezone, grouped by region with current UTC offsets. */
function TimezoneSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { groups, labels, known } = useMemo(() => {
    let zones: string[] = [];
    try {
      const sv = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
      if (sv) zones = sv("timeZone");
    } catch {
      /* fall through to fallback */
    }
    if (!zones.length) zones = FALLBACK_ZONES;
    if (!zones.includes("UTC")) zones = ["UTC", ...zones];

    const offset = (z: string): string => {
      try {
        return (
          new Intl.DateTimeFormat("en-US", { timeZone: z, timeZoneName: "shortOffset" })
            .formatToParts(new Date())
            .find((p) => p.type === "timeZoneName")?.value ?? ""
        );
      } catch {
        return "";
      }
    };

    const labels = new Map<string, string>();
    const byRegion = new Map<string, string[]>();
    for (const z of zones) {
      const city = z.includes("/") ? z.split("/").slice(1).join(" / ").replace(/_/g, " ") : z;
      const off = offset(z);
      labels.set(z, off ? `${city} (${off})` : city);
      const region = z.includes("/") ? z.split("/")[0] : "Other";
      (byRegion.get(region) ?? byRegion.set(region, []).get(region)!).push(z);
    }
    const groups = [...byRegion.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return { groups, labels, known: new Set(zones) };
  }, []);

  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {/* Keep a saved value selectable even if the runtime doesn't list it. */}
      {value && !known.has(value) && <option value={value}>{value}</option>}
      {groups.map(([region, zones]) => (
        <optgroup key={region} label={region}>
          {zones.map((z) => (
            <option key={z} value={z}>
              {labels.get(z)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}

function SecretField({
  label,
  value,
  onChange,
  configured,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  configured: boolean;
}) {
  return (
    <div>
      <label className="label flex items-center gap-2">
        {label}
        {configured ? (
          <span className="inline-flex items-center gap-1 text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> configured
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-slate-500">
            <Circle className="h-3.5 w-3.5" /> not set
          </span>
        )}
      </label>
      <input
        type="password"
        className="input"
        placeholder={configured ? "•••••••• (leave blank to keep)" : "Paste key…"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
