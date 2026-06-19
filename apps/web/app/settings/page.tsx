"use client";
import { useEffect, useState } from "react";
import { Save, KeyRound, Send, CheckCircle2, Circle } from "lucide-react";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { TimezoneSelect, detectZone } from "@/components/timezone-select";

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
