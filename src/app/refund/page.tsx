import Link from "next/link";

export const metadata = { title: "Refund & Pembatalan — Bagisawer" };

export default function RefundPage() {
  return (
    <main className="wrap" style={{minHeight:"100vh",maxWidth:900,paddingBottom:48}}>
      <header className="nav"><Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link><Link href="/support" className="btn btn-ghost">Pusat bantuan</Link></header>
      <section className="section" style={{paddingTop:48}}>
        <div className="section-kicker">KEBIJAKAN LAYANAN</div>
        <h1 style={{fontSize:"clamp(32px,5vw,48px)",letterSpacing:"-2px",lineHeight:1.1,margin:"12px 0 16px"}}>Refund & pembatalan</h1>
        <p style={{color:"var(--muted)",lineHeight:1.8}}>Halaman ini adalah rancangan kebijakan yang harus ditinjau secara hukum sebelum Bagisawer menerima pembayaran nyata.</p>
        <div className="feature-card" style={{marginTop:24}}>
          <h3>Belum ada transaksi produksi</h3>
          <p>Bagisawer belum mengaktifkan checkout dari penyedia pembayaran eksternal. Jangan mengirim uang ke rekening atau tautan yang mengatasnamakan Bagisawer melalui halaman pratinjau ini.</p>
        </div>
        <div className="feature-card" style={{marginTop:12}}>
          <h3>Ketentuan yang harus ditetapkan sebelum peluncuran</h3>
          <ul style={{color:"var(--muted)",lineHeight:1.9,paddingLeft:20}}>
            <li>Kapan transaksi dapat dibatalkan atau diajukan untuk refund.</li>
            <li>Proses penanganan pembayaran ganda, salah nominal, dan transaksi tidak sah.</li>
            <li>Penanganan sengketa dan pembalikan transaksi dari penyedia pembayaran.</li>
            <li>Batas waktu pengajuan, dokumen yang diperlukan, dan cara menghubungi dukungan.</li>
            <li>Bagaimana biaya provider dan biaya platform ditangani saat refund.</li>
          </ul>
        </div>
        <p style={{fontSize:12,color:"var(--muted)",lineHeight:1.8,marginTop:20}}>Kebijakan final akan dipublikasikan setelah provider pembayaran dipilih dan alur refund diuji. <Link href="/terms" style={{color:"#c4b5fd"}}>Baca syarat dan ketentuan ↗</Link></p>
      </section>
      <footer className="footer"><Link href="/">← Kembali ke beranda</Link></footer>
    </main>
  );
}