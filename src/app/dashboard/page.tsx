import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard — Bagisawer" };

export default async function DashboardPage() {
  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    redirect("/login");
  }
  if (!user) redirect("/login");
  return <main className="wrap" style={{paddingTop:48,minHeight:"100vh"}}>
    <header className="nav"><Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link><span style={{color:"var(--muted)",fontSize:13}}>{user.email}</span></header>
    <section style={{padding:"56px 0"}}>
      <div className="section-kicker">RUANG KREATOR</div><h1 style={{fontSize:44,letterSpacing:-2,margin:"14px 0"}}>Selamat datang.</h1>
      <p style={{color:"var(--muted)",lineHeight:1.8,maxWidth:600}}>Akunmu sudah terhubung. Dashboard kreator lengkap sedang dibangun bertahap; fitur transaksi dan pencairan belum aktif.</p>
      <div className="feature-grid" style={{marginTop:30}}>
        <article className="feature-card"><div className="feature-icon">◉</div><h3>Profil kreator</h3><p>Pengaturan profil dan halaman publik akan tersedia pada tahap berikutnya.</p></article>
        <article className="feature-card"><div className="feature-icon">↗</div><h3>Streaming</h3><p>Konfigurasi overlay dan alert belum diaktifkan.</p></article>
        <article className="feature-card"><div className="feature-icon">▤</div><h3>Transaksi</h3><p>Pembayaran nyata belum tersedia sampai gateway diverifikasi.</p></article>
      </div>
      <form action="/auth/signout" method="post" style={{marginTop:28}}><button className="btn btn-ghost" type="submit">Keluar</button></form>
    </section>
  </main>;
}