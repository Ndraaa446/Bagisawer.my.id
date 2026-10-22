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
  event_type: "test";
  source: "test";
  donor_name: string;
  message: string;
  amount: number;
};

type Payload = { settings: OverlaySettings; event: AlertEvent | null };

const fallbackSettings: OverlaySettings = {
  alert_enabled: true,
  minimum_amount: 1000,
  duration_seconds: 6,
  theme: "violet",
  sound_enabled: true
};

export function OverlayClient({ token }: { token: string }) {
  const [settings, setSettings] = useState(fallbackSettings);
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

  return (
    <main className="overlay-root" aria-live="polite">
      {activeAlert && (
        <section className={`overlay-alert overlay-${settings.theme}`} role="status">
          <div className="overlay-heart" aria-hidden="true">♡</div>
          <div className="overlay-copy">
            <span className="overlay-test-label">UJI COBA · BUKAN DONASI</span>
            <strong>{activeAlert.donor_name}</strong>
            <p>{activeAlert.message}</p>
            <b>Rp{activeAlert.amount.toLocaleString("id-ID")}</b>
          </div>
        </section>
      )}
    </main>
  );
}
