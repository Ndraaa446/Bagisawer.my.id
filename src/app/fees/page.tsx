import Link from "next/link";

export const metadata = { title: "Biaya — Bagisawer" };

export default function FeesPage() {
  return (
    <main className="wrap" style={{minHeight:"100vh",maxWidth:900,paddingBottom:48}}>
      <header className="nav"><Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link><Link href="/features" className="btn btn-ghost">Fitur</Link></header>
      <section className="section" style={{paddingTop:48}}>
        <div className="section-kicker">BIAYA TRANSPARAN</div>
        <h1 style={{fontSize:"clamp(32px,5vw,48px)",letterSpacing:"-2px",lineHeight:1.1,margin:"12px 0 16px"}}>Biaya dan potongan</h1>
        <p style={{color:"var(--muted)",lineHeight:1.8}}>Belum ada tarif produksi yang diumumkan. Kami tidak akan menampilkan persentase perkiraan sebagai harga resmi.</p>
        <div className="feature-card" style={{marginTop:24}}>
          <h3>Belum ditetapkan</h3>
          <p>Provider pembayaran belum dipilih. Tarif provider, pajak yang berlaku, biaya platform, dan nominal bersih kreator akan dihitung serta ditampilkan sebelum checkout diaktifkan.</p>
        </div>
        <div className="feature-grid" style={{marginTop:12}}>
          <article className="feature-card"><div className="feature-icon">▦</div><h3>Biaya provider</h3><p>Akan mengikuti kontrak dan metode pembayaran yang benar-benar didukung provider.</p></article>
          <article className="feature-card"><div className="feature-icon">♡</div><h3>Biaya platform</h3><p>Tarif dan cara perhitungannya akan diumumkan dengan jelas sebelum transaksi nyata tersedia.</p></article>
          <article className="feature-card"><div className="feature-icon">↗</div><h3>Saldo kreator</h3><p>Saldo tersedia, tertahan, refund, dan pencairan akan mengikuti ledger yang dapat diaudit.</p></article>
        </div>
        <p style={{fontSize:12,color:"var(--muted)",lineHeight:1.8,marginTop:20}}>Lihat juga <Link href="/refund" style={{color:"#c4b5fd"}}>kebijakan refund</Link> dan <Link href="/faq" style={{color:"#c4b5fd"}}>FAQ</Link>.</p>
      </section>
      <footer className="footer"><Link href="/">← Kembali ke beranda</Link></footer>
    </main>
  );
}