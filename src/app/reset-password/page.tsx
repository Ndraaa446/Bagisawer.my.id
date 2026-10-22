"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage("");
    if (password.length < 8) { setError("Kata sandi minimal 8 karakter."); return; }
    if (password !== confirmation) { setError("Konfirmasi kata sandi belum cocok."); return; }
    setBusy(true);
    try {
      const supabase = createClient();
      const result = await supabase.auth.updateUser({ password });
      if (result.error) throw result.error;
      setMessage("Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.");
      setPassword(""); setConfirmation("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tidak dapat memperbarui kata sandi. Minta tautan pemulihan baru.");
    } finally { setBusy(false); }
  }

  return <main className="auth-page">
    <Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link>
    <section className="auth-card">
      <div className="section-kicker">KEAMANAN AKUN</div>
      <h1 className="auth-title">Buat kata sandi baru</h1>
      <p className="auth-copy">Masukkan kata sandi baru minimal 8 karakter.</p>
      <form onSubmit={submit} className="auth-form">
        <label>Kata sandi baru <input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
        <label>Ulangi kata sandi <input type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
        <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>{busy ? "Memperbarui…" : "Simpan kata sandi"} <span aria-hidden="true">→</span></button>
      </form>
      <p className="auth-switch"><Link href="/login">Kembali ke halaman masuk</Link></p>
    </section>
  </main>;
}
