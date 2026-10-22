"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type CreatorProfile = {
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  is_public: boolean;
};

export function CreatorDashboard({ initialProfile, email }: { initialProfile: CreatorProfile; email: string }) {
  const [profile, setProfile] = useState(initialProfile);
  const [username, setUsername] = useState(initialProfile.username);
  const [displayName, setDisplayName] = useState(initialProfile.display_name);
  const [bio, setBio] = useState(initialProfile.bio);
  const [isPublic, setIsPublic] = useState(initialProfile.is_public);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedName = displayName.trim();
    const normalizedBio = bio.trim();

    if (!/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
      setError("Username harus 3–30 karakter, hanya huruf kecil, angka, dan garis bawah.");
      setBusy(false);
      return;
    }
    if (!normalizedName || normalizedName.length > 60) {
      setError("Nama tampilan wajib diisi dan maksimal 60 karakter.");
      setBusy(false);
      return;
    }
    if (normalizedBio.length > 280) {
      setError("Bio maksimal 280 karakter.");
      setBusy(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error: saveError } = await supabase
        .from("creator_profiles")
        .update({
          username: normalizedUsername,
          display_name: normalizedName,
          bio: normalizedBio,
          is_public: isPublic
        })
        .eq("user_id", profile.user_id)
        .select("user_id, username, display_name, bio, avatar_url, is_public")
        .single();

      if (saveError) {
        if (saveError.code === "23505") throw new Error("Username ini sudah digunakan. Coba username lain.");
        if (saveError.code === "42501" || saveError.code === "PGRST301") throw new Error("Sesi tidak valid. Silakan masuk kembali.");
        throw new Error(saveError.message);
      }

      setProfile(data as CreatorProfile);
      setUsername(data.username);
      setDisplayName(data.display_name);
      setBio(data.bio);
      setIsPublic(data.is_public);
      setMessage("Profil berhasil disimpan.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profil belum bisa disimpan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="wrap dashboard-page">
      <header className="nav dashboard-nav">
        <Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link>
        <div className="dashboard-user"><span>{email}</span><form action="/auth/signout" method="post"><button className="btn btn-ghost" type="submit">Keluar</button></form></div>
      </header>

      <section className="dashboard-intro">
        <div className="section-kicker">RUANG KREATOR</div>
        <h1 className="dashboard-title">Bangun ruang dukunganmu.</h1>
        <p className="dashboard-copy">Kelola identitas kreator dan siapkan halaman yang bisa kamu bagikan ke komunitas.</p>
      </section>

      <div className="dashboard-layout">
        <section className="feature-card dashboard-editor">
          <div className="section-kicker">PROFIL KREATOR</div>
          <h2 className="dashboard-section-title">Identitas publik</h2>
          <p className="dashboard-muted">Username menjadi alamat halamanmu. Halaman tetap privat sampai kamu mengaktifkan publikasi.</p>
          <form className="profile-form" onSubmit={saveProfile}>
            <label>Username
              <div className="username-field"><span>bagisawer.vercel.app/</span><input value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={30} pattern="[a-zA-Z0-9_]{3,30}" autoComplete="username" required /></div>
            </label>
            <label>Nama tampilan
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} required placeholder="Nama kreator kamu" />
            </label>
            <label>Bio
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={4} placeholder="Ceritakan sedikit tentang karya dan komunitasmu." />
              <span className="field-hint">{bio.length}/280 karakter</span>
            </label>
            <label className="publish-toggle">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              <span><strong>Publikasikan halaman</strong><small>Siapa pun dapat melihat profilmu melalui tautan publik.</small></span>
            </label>
            {error && <p className="auth-error" role="alert">{error}</p>}
            {message && <p className="auth-message" role="status">{message}</p>}
            <button className="btn btn-primary profile-save" type="submit" disabled={busy}>{busy ? "Menyimpan…" : "Simpan perubahan"} <span aria-hidden="true">→</span></button>
          </form>
        </section>

        <aside className="dashboard-side">
          <section className="feature-card profile-preview">
            <div className="section-kicker">PRATINJAU PROFIL</div>
            <div className="profile-avatar">{(displayName.trim()[0] || "K").toUpperCase()}</div>
            <h3>{displayName.trim() || "Nama kreator"}</h3>
            <p className="preview-username">@{username.trim().toLowerCase() || "username"}</p>
            <p className="preview-bio">{bio.trim() || "Bio kreator akan tampil di sini."}</p>
            <span className={isPublic ? "profile-status status-public" : "profile-status"}>{isPublic ? "Halaman publik" : "Halaman privat"}</span>
            {isPublic && <Link className="btn btn-ghost preview-link" href={`/${profile.username === username.trim().toLowerCase() ? profile.username : username.trim().toLowerCase()}`} target="_blank">Lihat halaman <span aria-hidden="true">↗</span></Link>}
          </section>
          <section className="feature-card next-steps">
            <div className="section-kicker">TAHAP BERIKUTNYA</div>
            <h3>Perluas ruang kreatormu</h3>
            <ul>
              <li><span>01</span> Halaman profil dan tautan berbagi</li>
              <li><span>02</span> Alert livestream dan overlay OBS</li>
              <li><span>03</span> Integrasi pembayaran terverifikasi</li>
            </ul>
            <p className="dashboard-muted">Pembayaran dan pencairan belum aktif. Jangan gunakan halaman ini untuk transaksi nyata.</p>
          </section>
        </aside>
      </div>
      <footer className="dashboard-footer">Bagisawer · Ruang kreator untuk komunitas Indonesia</footer>
    </main>
  );
}
