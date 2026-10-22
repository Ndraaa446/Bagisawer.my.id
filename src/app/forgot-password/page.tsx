"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`
      });
      if (resetError) throw resetError;
      setMessage("Jika email terdaftar, tautan pemulihan akan dikirim. Periksa kotak masuk dan folder spam.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Permintaan belum berhasil. Coba lagi.");
    } finally { setBusy(false); }
  }

  return <main className="auth-page">
    <Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link>
    <section className="auth-card">
      <div className="section-kicker">PEMULIHAN AKUN</div>
      <h1 className="auth-title">Lupa kata sandi?</h1>
      <p className="auth-copy">Masukkan email akunmu. Kami akan mengirimkan tautan untuk membuat kata sandi baru jika alamat tersebut terdaftar.</p>
      <form onSubmit={submit} className="auth-form">
        <label>Email <input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="kamu@email.com" /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
        <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>{busy ? "Mengirim…" : "Kirim tautan pemulihan"} <span aria-hidden="true">→</span></button>
      </form>
      <p className="auth-switch"><Link href="/login">Kembali ke halaman masuk</Link></p>
    </section>
  </main>;
}
