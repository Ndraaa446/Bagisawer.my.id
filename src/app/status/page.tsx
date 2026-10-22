import Link from "next/link";

export const metadata = { title: "Status Layanan — Bagisawer" };

const services = [
  ["Website publik", "Tampilan dasar tersedia", "amber"],
  ["Dashboard kreator", "Sedang dikembangkan", "amber"],
  ["Overlay OBS", "Token dan antrean dasar tersedia; uji langsung belum selesai", "amber"],
  ["Pembayaran nyata", "Belum diaktifkan", "muted"],
  ["Pencairan dana", "Belum diaktifkan", "muted"],
  ["Notifikasi eksternal", "Belum terhubung", "muted"],
];

export default function StatusPage() {
  return (
    <main className="wrap" style={{minHeight:"100vh",maxWidth:900,paddingBottom:48}}>
      <header className="nav"><Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link><Link href="/support" className="btn btn-ghost">Bantuan</Link></header>
      <section className="section" style={{paddingTop:48}}>
        <div className="section-kicker">STATUS PRODUK</div>
        <h1 style={{fontSize:"clamp(32px,5vw,48px)",letterSpacing:"-2px",lineHeight:1.1,margin:"12px 0 16px"}}>Status layanan Bagisawer</h1>
        <p style={{color:"var(--muted)",lineHeight:1.8}}>Ringkasan pengembangan manual, bukan pemantauan uptime real-time. Status akan diperbarui setelah pengujian dan integrasi layanan tersedia.</p>
        <div style={{display:"grid",gap:10,marginTop:24}}>
          {services.map(([name,description,tone]) => <article className="feature-card" key={name} style={{minHeight:0,display:"flex",gap:14,alignItems:"center",justifyContent:"space-between",flexWrap:"wrap"}}><div><h3 style={{marginBottom:5}}>{name}</h3><p style={{margin:0}}>{description}</p></div><span style={{border:"1px solid #ffffff18",borderRadius:99,padding:"6px 10px",fontSize:10,color:tone==="amber"?"#fde68a":"#c9c3d8"}}>{tone==="amber"?"Dalam pengembangan":"Nonaktif"}</span></article>)}
        </div>
      </section>
      <footer className="footer"><Link href="/">← Kembali ke beranda</Link></footer>
    </main>
  );
}