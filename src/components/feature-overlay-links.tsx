"use client";

import { useCallback, useEffect, useState } from "react";

type Feature = { slug: string; icon: string; title: string; description: string; group: string };
type OverlayStatus = { active: boolean; createdAt: string | null };
type Props = { features: Feature[] };

export function FeatureOverlayLinks({ features }: Props) {
  const [statuses, setStatuses] = useState<Record<string, OverlayStatus>>({});
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [testBusy, setTestBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/streaming/overlay-links", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Status overlay belum dapat dimuat.");
      const next: Record<string, OverlayStatus> = {};
      for (const item of data.features ?? []) {
        next[item.featureKey] = { active: Boolean(item.active), createdAt: item.createdAt ?? null };
      }
      setStatuses(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status overlay belum dapat dimuat.");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function manage(featureKey: string, action: "create" | "revoke") {
    if (busy || testBusy) return;
    if (action === "create" && statuses[featureKey]?.active && !window.confirm("Rotasi membuat URL lama untuk fitur ini langsung tidak berlaku. Lanjutkan?")) return;
    if (action === "revoke" && !window.confirm("Cabut URL overlay ini? Hanya overlay untuk fitur ini yang akan berhenti.")) return;

    setBusy(featureKey);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/streaming/overlay-links", {
        method: action === "create" ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureKey }),
        cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Permintaan overlay gagal.");
      if (action === "create") {
        setUrls((previous) => ({ ...previous, [featureKey]: data.url }));
        setStatuses((previous) => ({ ...previous, [featureKey]: { active: true, createdAt: new Date().toISOString() } }));
        setNotice(`URL khusus ${featureKey} dibuat. Salin dan simpan sekarang; URL lama untuk fitur ini tidak berlaku lagi.`);
      } else {
        setStatuses((previous) => ({ ...previous, [featureKey]: { active: false, createdAt: previous[featureKey]?.createdAt ?? null } }));
        setUrls((previous) => { const next = { ...previous }; delete next[featureKey]; return next; });
        setNotice(`URL overlay ${featureKey} sudah dicabut.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Permintaan overlay gagal.");
    } finally {
      setBusy(null);
    }
  }

  async function copyUrl(featureKey: string) {
    const url = urls[featureKey];
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setNotice(`URL overlay ${featureKey} disalin. Perlakukan URL ini seperti kata sandi.`);
    } catch {
      setError("Browser menolak akses clipboard. Pilih dan salin URL secara manual.");
    }
  }

  async function sendTest(featureKey: string) {
    if (testBusy || busy) return;
    setTestBusy(featureKey);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/streaming/overlay-links/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureKey }),
        cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Alert uji gagal dikirim.");
      setNotice(`Alert uji khusus ${featureKey} masuk ke antrean. Ini simulasi, bukan donasi.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Alert uji gagal dikirim.");
    } finally {
      setTestBusy(null);
    }
  }

  return (
    <>
      <div className="tool-card-footer" style={{marginBottom:16}}>
        <small>Segarkan status token dari server jika status overlay berubah di tab lain.</small>
        <button type="button" disabled={busy !== null || testBusy !== null} onClick={() => void refresh()}>Muat ulang status</button>
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="auth-message" role="status">{notice}</p>}
      <div className="tool-grid">
        {features.map((feature) => {
          const status = statuses[feature.slug];
          const url = urls[feature.slug];
          return (
            <article className="tool-card" id={feature.slug} key={feature.slug}>
              <div className="tool-card-top"><span className="tool-icon">{feature.icon}</span><div><h3>{feature.title}</h3><span className="tool-badge">{feature.group}</span></div></div>
              <p>{feature.description}</p>
              <span className={`tool-badge ${status?.active ? "tool-badge-green" : "tool-badge-amber"}`}>{status?.active ? "Token aktif" : status ? "Belum dibuat / dicabut" : "Memeriksa status…"}</span>
              {url ? (
                <div className="tool-overlay-url"><small>URL RAHASIA · {feature.slug.toUpperCase()}</small><code>{url}</code><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button type="button" onClick={() => void copyUrl(feature.slug)}>Salin URL</button><a href={url} target="_blank" rel="noreferrer" className="btn btn-ghost">Buka overlay ↗</a></div><small>Token mentah hanya tersedia saat dibuat/dirotasi. Simpan di tempat aman.</small></div>
              ) : (
                <div className="tool-overlay-url"><small>OVERLAY KHUSUS · {feature.slug.toUpperCase()}</small><code>{status?.active ? "URL lama tidak dapat ditampilkan ulang" : "Belum ada URL aktif"}</code><small>Token ini terpisah dari token fitur lain.</small></div>
              )}
              <div className="tool-card-footer">
                <small>{status?.active ? "Tautan aktif" : "Belum aktif"}</small>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"flex-end"}}>
                  <button type="button" disabled={busy !== null || testBusy !== null} onClick={() => void manage(feature.slug, "create")}>{busy === feature.slug ? "Memproses…" : status?.active ? "Rotasi URL" : "Buat URL"}</button>
                  {status?.active && <button type="button" disabled={busy !== null || testBusy !== null} onClick={() => void sendTest(feature.slug)}>{testBusy === feature.slug ? "Mengirim…" : "Tes alert"}</button>}
                  {status?.active && <button type="button" disabled={busy !== null || testBusy !== null} onClick={() => void manage(feature.slug, "revoke")}>Cabut</button>}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
