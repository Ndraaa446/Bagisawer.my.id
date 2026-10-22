"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type StreamSettings = {
  user_id: string;
  alert_enabled: boolean;
  minimum_amount: number;
  duration_seconds: number;
  theme: "violet" | "minimal" | "neon";
  sound_enabled: boolean;
};

const themeLabels: Record<StreamSettings["theme"], string> = {
  violet: "Violet",
  minimal: "Minimal",
  neon: "Neon"
};

export function StreamingSettings({ initialSettings, email }: { initialSettings: StreamSettings; email: string }) {
  const [settings, setSettings] = useState(initialSettings);
  const [minimumAmount, setMinimumAmount] = useState(String(initialSettings.minimum_amount));
  const [duration, setDuration] = useState(String(initialSettings.duration_seconds));
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tokenStatus, setTokenStatus] = useState<"loading" | "active" | "inactive" | "unavailable">("loading");
  const [tokenUrl, setTokenUrl] = useState("");
  const [tokenBusy, setTokenBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/streaming/overlay-token", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setTokenStatus(response.status === 503 ? "unavailable" : "inactive");
          if (data.error) setError(data.error);
          return;
        }
        setTokenStatus(data.active ? "active" : "inactive");
      })
      .catch(() => { if (!cancelled) setTokenStatus("unavailable"); });
    return () => { cancelled = true; };
  }, []);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    const amount = Number(minimumAmount);
    const seconds = Number(duration);
    if (!Number.isInteger(amount) || amount < 0 || amount > 100000000) {
      setError("Nominal minimum harus berupa angka bulat antara Rp0 dan Rp100.000.000.");
      setBusy(false);
      return;
    }
    if (!Number.isInteger(seconds) || seconds < 3 || seconds > 15) {
      setError("Durasi alert harus antara 3 sampai 15 detik.");
      setBusy(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Sesi tidak valid. Silakan masuk kembali.");

      const nextSettings = {
        user_id: user.id,
        alert_enabled: settings.alert_enabled,
        minimum_amount: amount,
        duration_seconds: seconds,
        theme: settings.theme,
        sound_enabled: settings.sound_enabled,
        updated_at: new Date().toISOString()
      };
      const { error: saveError } = await supabase
        .from("creator_stream_settings")
        .upsert(nextSettings, { onConflict: "user_id" });
      if (saveError) throw new Error("Pengaturan belum tersimpan. Periksa koneksi lalu coba lagi.");

      setSettings({ ...nextSettings, minimum_amount: amount, duration_seconds: seconds });
      setMessage("Pengaturan livestream berhasil disimpan.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan saat menyimpan pengaturan.");
    } finally {
      setBusy(false);
    }
  }

  async function manageToken(action: "rotate" | "revoke") {
    if (tokenBusy) return;
    if (action === "rotate" && tokenStatus === "active" && !window.confirm("Token lama akan langsung tidak berlaku dan URL OBS lama terputus. Lanjutkan rotasi?")) return;
    if (action === "revoke" && !window.confirm("Cabut token sekarang? Overlay yang memakai URL ini akan berhenti menerima event.")) return;

    setTokenBusy(true);
    setMessage("");
    setError("");
    setTokenUrl("");
    try {
      const response = await fetch("/api/streaming/overlay-token", {
        method: action === "rotate" ? "POST" : "DELETE",
        cache: "no-store"
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Permintaan token gagal.");
      if (action === "rotate") {
        setTokenUrl(data.url);
        setTokenStatus("active");
        setMessage("URL overlay baru dibuat. Salin sekarang dan perbarui Browser Source di OBS.");
      } else {
        setTokenStatus("inactive");
        setMessage("Token overlay sudah dicabut.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Token overlay belum dapat diperbarui.");
      if (action === "rotate") setTokenStatus("unavailable");
    } finally {
      setTokenBusy(false);
    }
  }

  async function copyOverlayUrl() {
    try {
      await navigator.clipboard.writeText(tokenUrl);
      setMessage("URL overlay disalin. Perlakukan seperti kata sandi.");
    } catch {
      setError("Browser menolak akses clipboard. Pilih dan salin URL secara manual.");
    }
  }

  async function sendTestAlert() {
    if (testBusy) return;
    setTestBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/streaming/test-alert", { method: "POST", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Alert uji gagal dikirim.");
      setMessage("Alert uji masuk ke antrean. Pastikan OBS membuka URL overlay yang aktif.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Alert uji gagal dikirim.");
    } finally {
      setTestBusy(false);
    }
  }

  return (
    <main className="wrap dashboard-page">
      <header className="nav dashboard-nav">
        <Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link>
        <div className="dashboard-user"><span>{email}</span><Link className="btn btn-ghost" href="/dashboard">Dashboard</Link><Link className="btn btn-ghost" href="/dashboard/payments/sandbox">Payment Sandbox</Link><form action="/auth/signout" method="post"><button className="btn btn-ghost" type="submit">Keluar</button></form></div>
      </header>

      <section className="dashboard-intro">
        <div className="section-kicker">LIVESTREAM & OBS</div>
        <h1 className="dashboard-title">Siapkan alert siaranmu.</h1>
        <p className="dashboard-copy">Atur tampilan alert, kelola URL Browser Source privat, dan kirim event uji tanpa membuat transaksi.</p>
      </section>

      <div className="streaming-layout">
        <section className="feature-card dashboard-editor">
          <div className="section-kicker">PENGATURAN ALERT</div>
          <h2 className="dashboard-section-title">Tampilan dan perilaku</h2>
          <form className="profile-form" onSubmit={saveSettings}>
            <label className="publish-toggle">
              <input type="checkbox" checked={settings.alert_enabled} onChange={(e) => setSettings({ ...settings, alert_enabled: e.target.checked })} />
              <span><strong>Aktifkan alert</strong><small>Jika dimatikan, overlay tidak menampilkan event sampai alert diaktifkan kembali.</small></span>
            </label>
            <label>Nominal minimum (rupiah)
              <input type="number" min="0" max="100000000" step="1000" value={minimumAmount} onChange={(e) => setMinimumAmount(e.target.value)} required />
              <span className="field-hint">Ambang ini disimpan untuk alur event; event uji selalu diberi label uji.</span>
            </label>
            <label>Durasi alert
              <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                <option value="3">3 detik</option><option value="4">4 detik</option><option value="5">5 detik</option><option value="6">6 detik</option><option value="8">8 detik</option><option value="10">10 detik</option><option value="12">12 detik</option><option value="15">15 detik</option>
              </select>
            </label>
            <label>Tema alert
              <select value={settings.theme} onChange={(e) => setSettings({ ...settings, theme: e.target.value as StreamSettings["theme"] })}>
                <option value="violet">Violet — khas Bagisawer</option><option value="minimal">Minimal — bersih</option><option value="neon">Neon — kontras tinggi</option>
              </select>
            </label>
            <label className="publish-toggle">
              <input type="checkbox" checked={settings.sound_enabled} onChange={(e) => setSettings({ ...settings, sound_enabled: e.target.checked })} />
              <span><strong>Suara alert</strong><small>Preferensi tersimpan; audio akan ditambahkan terpisah setelah alur alert visual diuji.</small></span>
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            {message && <p className="auth-message" role="status">{message}</p>}
            <div className="streaming-actions">
              <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Simpan pengaturan"} <span aria-hidden="true">→</span></button>
              <button className="btn btn-ghost" type="button" onClick={() => setPreview((value) => !value)}>{preview ? "Tutup pratinjau" : "Pratinjau lokal"}</button>
            </div>
          </form>
        </section>

        <aside className="dashboard-side">
          <section className={`feature-card alert-preview theme-${settings.theme}`}>
            <div className="section-kicker">PRATINJAU LOKAL</div>
            <div className="alert-stage">
              {preview ? <div className="sample-alert"><div className="sample-alert-icon">♡</div><div><strong>Terima kasih, Pendukung!</strong><p>Semangat terus berkarya ✨</p><b>Rp25.000</b></div></div> : <div className="alert-placeholder"><span>♡</span><strong>Alert kamu tampil di sini</strong><small>Tekan “Pratinjau lokal” untuk melihat contoh.</small></div>}
            </div>
            <div className="preview-meta"><span>Tema: {themeLabels[settings.theme]}</span><span>Durasi: {duration} detik</span></div>
            <p className="dashboard-muted">Pratinjau ini hanya simulasi visual, tidak membuat transaksi.</p>
          </section>

          <section className="feature-card overlay-token-panel">
            <div className="section-kicker">URL OVERLAY OBS</div>
            <h3>Browser Source privat</h3>
            <div className="overlay-token-status">
              <span className={`status-dot status-${tokenStatus}`} />
              {tokenStatus === "loading" ? "Memeriksa status…" : tokenStatus === "active" ? "Token aktif" : tokenStatus === "inactive" ? "Belum ada token aktif" : "Layanan token belum siap"}
            </div>
            <p className="dashboard-muted">URL memuat token rahasia. Jangan bagikan di layar, chat publik, atau tangkapan layar. Token disimpan dalam bentuk hash dan URL mentah hanya ditampilkan saat dibuat.</p>
            {tokenUrl && <div className="overlay-url-box"><code>{tokenUrl}</code><button className="btn btn-ghost" type="button" onClick={copyOverlayUrl}>Salin URL</button><p>{/* keep URL visible until copied or page is closed */}Simpan URL ini sebelum meninggalkan halaman. Token tidak dapat ditampilkan ulang.</p></div>}
            <div className="streaming-actions">
              <button className="btn btn-primary" type="button" disabled={tokenBusy || tokenStatus === "unavailable"} onClick={() => manageToken("rotate")}>{tokenBusy ? "Memproses…" : tokenStatus === "active" ? "Rotasi URL overlay" : "Buat URL overlay"}</button>
              {tokenStatus === "active" && <button className="btn btn-ghost" type="button" disabled={tokenBusy} onClick={() => manageToken("revoke")}>Cabut token</button>}
            </div>
            {tokenStatus === "unavailable" && <p className="auth-error overlay-config-note">Server memerlukan secret Supabase khusus server. Jangan menaruh service-role/secret key di variabel NEXT_PUBLIC_.</p>}
            <button className="btn btn-ghost overlay-test-button" type="button" disabled={testBusy || tokenStatus !== "active"} onClick={sendTestAlert}>{testBusy ? "Mengirim…" : "Kirim alert uji ke OBS"}</button>
            <p className="dashboard-muted overlay-footnote">Event uji ditandai “UJI COBA · BUKAN DONASI” dan tidak menambah saldo.</p>
          </section>

          <section className="feature-card obs-setup">
            <div className="section-kicker">LANGKAH OBS</div>
            <h3>Hubungkan Browser Source</h3>
            <ol>
              <li><span>01</span> Buat URL overlay privat di panel ini.</li>
              <li><span>02</span> Di OBS Studio, tambahkan sumber <strong>Browser</strong> dan tempel URL privat.</li>
              <li><span>03</span> Atur ukuran sumber, misalnya 800 × 450, lalu simpan scene.</li>
              <li><span>04</span> Tekan “Kirim alert uji ke OBS” untuk memeriksa event.</li>
            </ol>
            <p className="dashboard-muted">Jika token dicabut atau dirotasi, URL lama langsung berhenti bekerja. Buat URL baru dan perbarui sumber OBS.</p>
          </section>
        </aside>
      </div>
      <footer className="dashboard-footer">Bagisawer · Overlay OBS · Alert uji bukan donasi</footer>
    </main>
  );
}
