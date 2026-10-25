import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Jelajahi Kreator — Bagisawer" };

export default async function ExplorePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("creator_profiles")
    .select("username, display_name, bio, avatar_url")
    .eq("is_public", true)
    .order("display_name", { ascending: true })
    .limit(24);
  const creators = error ? [] : data ?? [];

  return (
    <main className="wrap" style={{minHeight:"100vh",paddingBottom:48}}>
      <header className="nav"><Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link><div style={{display:"flex",gap:8}}><Link href="/features" className="btn btn-ghost">Fitur</Link><Link href="/register" className="btn btn-primary">Buat halaman</Link></div></header>
      <section className="section">
        <div className="section-head"><div className="section-kicker">JELAJAHI KOMUNITAS</div><h1 style={{fontSize:"clamp(32px,5vw,48px)",letterSpacing:"-2px",lineHeight:1.1,margin:"12px auto 16px"}}>Temukan kreator favoritmu.</h1><p>Daftar ini hanya menampilkan profil publik yang tersedia. Tidak ada jumlah dukungan atau ranking palsu.</p></div>
        {creators.length ? <div className="feature-grid">{creators.map((creator) => <article className="feature-card" key={creator.username}><div className="feature-icon">{creator.display_name.slice(0,1).toUpperCase()}</div><h3>{creator.display_name}</h3><p style={{color:"var(--muted)",fontSize:12,marginBottom:8}}>@{creator.username}</p><p>{creator.bio || "Kreator ini belum menambahkan bio."}</p><div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:15}}><Link className="btn btn-ghost" href={`/${creator.username}`}>Lihat profil ↗</Link><Link className="btn btn-primary" href={`/${creator.username}/dukung`}>Pratinjau dukungan</Link></div></article>)}</div> : <div className="feature-card" style={{maxWidth:680,margin:"0 auto",textAlign:"center"}}><h3>Belum ada kreator publik</h3><p>Ketika kreator menerbitkan profilnya, profil akan muncul di halaman ini.</p><Link className="btn btn-primary" href="/register">Buat akun kreator ↗</Link></div>}
      </section>
      <footer className="footer"><Link href="/">← Kembali ke beranda</Link></footer>
    </main>
  );
}