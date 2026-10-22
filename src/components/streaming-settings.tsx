"use client";

import { FormEvent, useState } from "react";
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

  return (
    <main className="wrap dashboard-page">
      <header className="nav dashboard-nav">
        <Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link>
        <div className="dashboard-user"><span>{email}</span><Link className="btn btn-ghost" href="/dashboard">Dashboard</Link><form action="/auth/signout" method="post"><button className="btn btn-ghost" type="submit">Keluar</button></form></div>
      </header>

      <section className="dashboard-intro">
        <div className="section-kicker">LIVESTREAM & OBS</div>
        <h1 className="dashboard-title">Siapkan alert siaranmu.</h1>
        <p className="dashboard-copy">Atur tampilan alert yang akan menjadi dasar overlay browser source. Pengaturan tersimpan di akun kreatormu.</p>
      </section>

      <div className="streaming-layout">
        <section className="feature-card dashboard-editor">
          <div className="section-kicker">PENGATURAN ALERT</div>
          <h2 className="dashboard-section-title">Tampilan dan perilaku</h2>
          <form className="profile-form" onSubmit={saveSettings}>
            <label className="publish-toggle">
              <input type="checkbox" checked={settings.alert_enabled} onChange={(e) => setSettings({ ...settings, alert_enabled: e.target.checked })} />
              <span><strong>Aktifkan alert</strong><small>Kontrol ini mengatur kesiapan alert untuk overlay ketika integrasi event tersedia.</small></span>
            </label>
            <label>Nominal minimum (rupiah)
              <input type="number" min="0" max="100000000" step="1000" value={minimumAmount} onChange={(e) => setMinimumAmount(e.target.value)} required />
              <span className="field-hint">Alert di bawah nominal ini nantinya dapat disaring.</span>
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
              <span><strong>Suara alert</strong><small>Preferensi suara disimpan; audio overlay nyata akan dihubungkan pada tahap berikutnya.</small></span>
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            {message && <p className="auth-message" role="status">{message}</p>}
            <div className="streaming-actions">
              <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Simpan pengaturan"} <span aria-hidden="true">→</span></button>
              <button className="btn btn-ghost" type="button" onClick={() => setPreview((value) => !value)}>{preview ? "Tutup pratinjau" : "Uji pratinjau"}</button>
            </div>
          </form>
        </section>

        <aside className="dashboard-side">
          <section className={`feature-card alert-preview theme-${settings.theme}`}>
            <div className="section-kicker">PRATINJAU LOKAL</div>
            <div className="alert-stage">
              {preview ? <div className="sample-alert"><div className="sample-alert-icon">♡</div><div><strong>Terima kasih, Pendukung!</strong><p>Semangat terus berkarya ✨</p><b>Rp25.000</b></div></div> : <div className="alert-placeholder"><span>♡</span><strong>Alert kamu tampil di sini</strong><small>Tekan “Uji pratinjau” untuk melihat contoh.</small></div>}
            </div>
            <div className="preview-meta"><span>Tema: {themeLabels[settings.theme]}</span><span>Durasi: {duration} detik</span></div>
            <p className="dashboard-muted">Ini hanya simulasi visual lokal, bukan donasi nyata dan tidak mengirim event ke OBS.</p>
          </section>

          <section className="feature-card obs-setup">
            <div className="section-kicker">LANGKAH OBS</div>
            <h3>Hubungkan setelah overlay siap</h3>
            <ol>
              <li><span>01</span> Buka OBS Studio dan pilih sumber <strong>Browser</strong>.</li>
              <li><span>02</span> Masukkan URL overlay privat dari dashboard saat token overlay tersedia.</li>
              <li><span>03</span> Atur ukuran kanvas mengikuti resolusi siaranmu.</li>
            </ol>
            <p className="dashboard-muted">URL overlay bertoken, rotasi token, dan event real-time belum aktif. Jangan menempelkan URL contoh ke OBS untuk siaran nyata.</p>
          </section>
        </aside>
      </div>
      <footer className="dashboard-footer">Bagisawer · Pengaturan livestream · Pratinjau tidak memicu transaksi</footer>
    </main>
  );
}
