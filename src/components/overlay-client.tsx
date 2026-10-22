"use client";

import { useEffect, useRef, useState } from "react";

type OverlaySettings = {
  alert_enabled: boolean;
  minimum_amount: number;
  duration_seconds: number;
  theme: "violet" | "minimal" | "neon";
  sound_enabled: boolean;
};

type AlertEvent = {
  id: string;
  event_type: string;
  source: string;
  donor_name: string;
  message: string;
  amount: number;
};

type Payload = { settings: OverlaySettings; event: AlertEvent | null; featureKey?: string };

const fallbackSettings: OverlaySettings = {
  alert_enabled: true,
  minimum_amount: 1000,
  duration_seconds: 6,
  theme: "violet",
  sound_enabled: true
};

const featureTitles: Record<string, string> = {
  general: "Dukungan baru",
  saweran: "Saweran masuk",
  anonim: "Dukungan anonim",
  pesan: "Pesan dukungan",
  target: "Target dukungan",
  mediashare: "Permintaan media",
  voicenote: "Voice note masuk",
  lagu: "Request lagu",
  qris: "Dukungan QR",
  leaderboard: "Peringkat pendukung",
  subathon: "Subathon",
  "running-text": "Running text",
  soundboard: "Soundboard",
  polling: "Polling",
  "vip-queue": "VIP queue",
  bagpao: "Bagpao",
  gachaton: "Gachaton",
  bidcoin: "Bidcoin"
};

export function OverlayClient({ token }: { token: string }) {
  const [settings, setSettings] = useState(fallbackSettings);
  const [featureKey, setFeatureKey] = useState("general");
  const [activeAlert, setActiveAlert] = useState<AlertEvent | null>(null);
  const [invalid, setInvalid] = useState(false);
  const activeRef = useRef(false);

  useEffect(() => {
    let stopped = false;

    async function poll() {
      try {
        const response = await fetch(`/api/overlay/${encodeURIComponent(token)}`, { cache: "no-store" });
        if (response.status === 404) {
          if (!stopped) setInvalid(true);
          return;
        }
        if (!response.ok) return;
        const payload = await response.json() as Payload;
        if (stopped) return;
        setSettings(payload.settings ?? fallbackSettings);
        setFeatureKey(payload.featureKey ?? "general");
        if (payload.event && !activeRef.current) {
          activeRef.current = true;
          setActiveAlert(payload.event);
        }
      } catch {
        // Temporary network failures are retried by the next poll.
      }
    }

    void poll();
    const timer = window.setInterval(() => void poll(), 1500);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [token]);

  useEffect(() => {
    if (!activeAlert) return;
    const event = activeAlert;
    const timer = window.setTimeout(async () => {
      try {
        await fetch(`/api/overlay/${encodeURIComponent(token)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: event.id }),
          cache: "no-store"
        });
      } finally {
        activeRef.current = false;
        setActiveAlert(null);
      }
    }, Math.max(3, Math.min(15, settings.duration_seconds)) * 1000);

    return () => window.clearTimeout(timer);
  }, [activeAlert, settings.duration_seconds, token]);

  if (invalid || !settings.alert_enabled) return null;
  const testLabel = activeAlert?.source === "test" || activeAlert?.event_type === "test";
  const title = featureTitles[featureKey] ?? "Dukungan baru";

  return (
    <main className="overlay-root" aria-live="polite">
      <style>{`
        .overlay-feature-label{display:block;font-size:10px;font-weight:800;letter-spacing:1.5px;color:#d9ccff;margin-bottom:7px}
        .overlay-feature-note{font-size:10px;color:#c4b5fd;line-height:1.5;margin-top:7px}
        .overlay-running-text{max-width:100%;padding:14px 24px;border:1px solid #d9c8b7;border-radius:12px;background:#fffdf9;color:#302319;box-shadow:none;backdrop-filter:none;overflow:hidden;white-space:nowrap}
        .overlay-running-text strong{color:#754426;margin-right:12px}
        .overlay-module-card{display:flex;gap:16px;align-items:center;max-width:700px;padding:20px 24px;border:1px solid #d9c8b7;border-radius:12px;background:#fffdf9;box-shadow:none;backdrop-filter:none;color:#302319}
        .overlay-module-icon{width:48px;height:48px;border-radius:10px;display:grid;place-items:center;background:#f0e3d7;color:#754426;font-size:23px;flex-shrink:0}
        .overlay-module-copy strong{font-size:19px;display:block}.overlay-module-copy p{font-size:13px;color:#ddd6eb;line-height:1.6;margin:5px 0}
        .overlay-module-copy b{font-size:15px;color:#c4b5fd}
      `}</style>
      {activeAlert && (featureKey === "running-text" ? (
        <section className="overlay-running-text" role="status">
          <strong>{testLabel ? "UJI COBA" : title}</strong><span>{activeAlert.donor_name}: {activeAlert.message}</span>
        </section>
      ) : featureKey === "mediashare" || featureKey === "voicenote" || featureKey === "lagu" ? (
        <section className="overlay-module-card" role="status">
          <div className="overlay-module-icon">{featureKey === "mediashare" ? "▶" : featureKey === "voicenote" ? "♫" : "♪"}</div>
          <div className="overlay-module-copy">
            <span className="overlay-feature-label">{testLabel ? "UJI COBA · BUKAN DONASI" : title.toUpperCase()}</span>
            <strong>{activeAlert.donor_name}</strong><p>{activeAlert.message}</p>
            <b>Rp{activeAlert.amount.toLocaleString("id-ID")}</b>
            <div className="overlay-feature-note">{featureKey === "mediashare" ? "Pemutaran media memerlukan validasi URL dan moderasi." : featureKey === "voicenote" ? "Pemutaran audio menunggu validasi dan persetujuan." : "Permintaan lagu harus memakai integrasi resmi yang diizinkan."}</div>
          </div>
        </section>
      ) : (
        <section className={`overlay-alert overlay-${settings.theme} overlay-feature-${featureKey}`} role="status">
          <div className="overlay-heart" aria-hidden="true">{featureKey === "leaderboard" ? "♜" : featureKey === "subathon" ? "◷" : featureKey === "polling" ? "☷" : featureKey === "soundboard" ? "◖" : "♡"}</div>
          <div className="overlay-copy">
            <span className="overlay-test-label">{testLabel ? "UJI COBA · BUKAN DONASI" : title.toUpperCase()}</span>
            <strong>{activeAlert.donor_name}</strong>
            <p>{activeAlert.message}</p>
            <b>Rp{activeAlert.amount.toLocaleString("id-ID")}</b>
          </div>
        </section>
      ))}
    </main>
  );
}
