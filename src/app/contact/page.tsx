"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [category, setCategory] = useState("umum");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [notice, setNotice] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Formulir ini masih berupa tampilan. Sistem tiket dan pengiriman email belum terhubung, jadi pesan belum dikirim.");
  }

  return (
    <main className="wrap" style={{minHeight:"100vh",maxWidth:900,paddingBottom:48}}>
      <header className="nav"><Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link><Link href="/faq" className="btn btn-ghost">FAQ</Link></header>
      <section className="section" style={{paddingTop:48}}>
        <div className="section-kicker">PUSAT BANTUAN</div>
        <h1 style={{fontSize:"clamp(32px,5vw,48px)",letterSpacing:"-2px",lineHeight:1.1,margin:"12px 0 16px"}}>Hubungi tim Bagisawer</h1>
        <p style={{color:"var(--muted)",lineHeight:1.8}}>Pilih topik dan jelaskan kebutuhanmu. Formulir sedang disiapkan; pengiriman pesan belum aktif.</p>
        <form className="feature-card" onSubmit={submit} style={{display:"grid",gap:15,marginTop:24}}>
          <label style={{display:"grid",gap:7,fontSize:12,fontWeight:700}}>Kategori
            <select value={category} onChange={(event)=>setCategory(event.target.value)} style={{padding:12,borderRadius:10,border:"1px solid var(--line)",background:"#0f0d15",color:"var(--text)"}}><option value="umum">Pertanyaan umum</option><option value="akun">Akun dan keamanan</option><option value="pembayaran">Pembayaran dan refund</option><option value="overlay">OBS dan overlay</option><option value="laporan">Laporan dan moderasi</option></select>
          </label>
          <label style={{display:"grid",gap:7,fontSize:12,fontWeight:700}}>Email untuk balasan<input type="email" value={email} onChange={(event)=>setEmail(event.target.value)} required maxLength={254} placeholder="nama@contoh.com" style={{padding:12,borderRadius:10,border:"1px solid var(--line)",background:"#0f0d15",color:"var(--text)"}} /></label>
          <label style={{display:"grid",gap:7,fontSize:12,fontWeight:700}}>Subjek<input value={subject} onChange={(event)=>setSubject(event.target.value)} required maxLength={120} placeholder="Ringkasan pertanyaan" style={{padding:12,borderRadius:10,border:"1px solid var(--line)",background:"#0f0d15",color:"var(--text)"}} /></label>
          <label style={{display:"grid",gap:7,fontSize:12,fontWeight:700}}>Pesan<textarea value={message} onChange={(event)=>setMessage(event.target.value)} required maxLength={3000} rows={6} placeholder="Jelaskan masalah atau pertanyaanmu…" style={{padding:12,borderRadius:10,border:"1px solid var(--line)",background:"#0f0d15",color:"var(--text)",resize:"vertical"}} /></label>
          <button className="btn btn-primary" type="submit">Tinjau permintaan</button>
          {notice && <p className="auth-message" role="status">{notice}</p>}
          <p style={{fontSize:11,color:"var(--muted)",lineHeight:1.7,margin:0}}>Jangan masukkan kata sandi, kode OTP, atau informasi pembayaran sensitif.</p>
        </form>
      </section>
      <footer className="footer"><Link href="/">← Kembali ke beranda</Link></footer>
    </main>
  );
}