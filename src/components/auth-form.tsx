"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode, initialError }: { mode: "login" | "register"; initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const supabase = createClient();
      if (isRegister) {
        const { error: authError, data } = await supabase.auth.signUp({
          email: normalizedEmail, password,
          options: { data: { display_name: username.trim() || normalizedEmail.split("@")[0] }, emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` }
        });
        if (authError) throw authError;
        if (data.session) {
          setMessage("Akun berhasil dibuat. Mengalihkan ke dashboard…");
          router.push("/dashboard"); router.refresh();
        } else {
          setMessage("Pendaftaran diterima. Periksa email untuk verifikasi sebelum masuk.");
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (authError) throw authError;
        router.push("/dashboard"); router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.");
    } finally { setBusy(false); }
  }

  return <main className="auth-page">
    <Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link>
    <section className="auth-card">
      <div className="section-kicker">{isRegister ? "MULAI PERJALANANMU" : "SELAMAT DATANG KEMBALI"}</div>
      <h1 className="auth-title">{isRegister ? "Buat akun Bagisawer" : "Masuk ke akunmu"}</h1>
      <p className="auth-copy">{isRegister ? "Siapkan ruang dukungan untuk komunitasmu." : "Lanjutkan mengelola ruang kreatormu."}</p>
      <form onSubmit={handleSubmit} className="auth-form">
        {isRegister && <label>Nama kreator <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Nama yang ingin ditampilkan" maxLength={60} autoComplete="nickname" /></label>}
        <label>Email <input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="kamu@email.com" autoComplete="email" /></label>
        <label>Kata sandi <input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 8 karakter" autoComplete={isRegister ? "new-password" : "current-password"} /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {message && <p className="auth-message" role="status">{message}</p>}
        <button className="btn btn-primary auth-submit" type="submit" disabled={busy}>{busy ? "Memproses…" : isRegister ? "Buat akun" : "Masuk"} <span aria-hidden="true">→</span></button>
      </form>
      {!isRegister && <p className="auth-switch"><Link href="/forgot-password">Lupa kata sandi?</Link></p>}
      <p className="auth-switch">{isRegister ? "Sudah punya akun?" : "Belum punya akun?"} <Link href={isRegister ? "/login" : "/register"}>{isRegister ? "Masuk" : "Daftar sekarang"}</Link></p>
      <p className="auth-note">Autentikasi menggunakan Supabase. Pastikan konfigurasi Supabase dan verifikasi email sudah disiapkan.</p>
    </section>
  </main>;
}