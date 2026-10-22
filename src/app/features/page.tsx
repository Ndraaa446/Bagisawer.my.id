import Link from "next/link";

export const metadata = { title: "Fitur — Bagisawer" };

const groups = [
  { title: "Donasi dan dukungan", items: [
    ["Saweran standar", "Nominal rekomendasi/kustom, nama opsional, pesan, dan dukungan anonim."],
    ["Target & milestone", "Progres target dukungan dan perayaan milestone."],
    ["Mediashare & voice note", "Antrean video/suara dengan batas ukuran, durasi, dan moderasi."],
    ["Request lagu & QR", "Permintaan lagu melalui integrasi resmi dan QR menuju halaman dukungan."]
  ]},
  { title: "Livestream & overlay", items: [
    ["Overlay terpisah per fitur", "Setiap jenis modul mempunyai token URL sendiri yang dapat dibuat, dirotasi, diuji, dan dicabut."],
    ["OBS Browser Source", "Pengaturan tema, durasi, ambang alert, dan antrean event."],
    ["Interaksi komunitas", "Leaderboard, subathon, running text, soundboard, polling, dan VIP queue."],
    ["Modul lanjutan", "Bagpao, Gachaton, Bidcoin, kompetisi, klip, store, dan voucher memerlukan implementasi lanjutan."]
  ]},
  { title: "Dashboard dan keamanan", items: [
    ["Profil kreator", "Username, bio, halaman publik, dan pratinjau dukungan."],
    ["Keuangan & laporan", "Riwayat, saldo, biaya, refund, pencairan, dan laporan setelah backend finansial tersedia."],
    ["Notifikasi & moderasi", "Pusat notifikasi, pelaporan, review media, dan audit trail."],
    ["Keamanan", "Token privat, validasi server, idempotensi sandbox, dan kontrol akses."]
  ]}
];

const paymentMethods = ["QRIS", "Virtual Account", "Transfer bank", "GoPay", "DANA", "OVO", "ShopeePay", "LinkAja", "Kartu debit/kredit", "Gerai retail"];

export default function FeaturesPage() {
  return (
    <main className="wrap" style={{minHeight:"100vh",paddingBottom:48}}>
      <header className="nav"><Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Link href="/explore" className="btn btn-ghost">Jelajahi</Link><Link href="/register" className="btn btn-primary">Mulai sekarang →</Link></div></header>
      <section className="section">
        <div className="section-head"><div className="section-kicker">FITUR BAGISAWER</div><h1 style={{fontSize:"clamp(32px,5vw,48px)",letterSpacing:"-2px",lineHeight:1.1,margin:"12px auto 16px"}}>Satu ruang untuk dukungan dan interaksi kreator.</h1><p>Semua modul disusun dalam katalog produk. Status integrasi dijelaskan secara terbuka; halaman yang sudah ada belum tentu berarti backend-nya siap produksi.</p></div>
        {groups.map((group) => <section key={group.title} style={{marginTop:34}}><div className="section-kicker">{group.title}</div><div className="feature-grid" style={{marginTop:14}}>{group.items.map(([title,desc]) => <article className="feature-card" key={title}><div className="feature-icon">✦</div><h3>{title}</h3><p>{desc}</p></article>)}</div></section>)}
        <section style={{marginTop:38}}><div className="section-kicker">METODE PEMBAYARAN YANG DIPETAKAN</div><h2>Metode mengikuti provider resmi.</h2><p style={{color:"var(--muted)",lineHeight:1.8}}>Belum ada provider pembayaran yang dipilih, sehingga seluruh metode berikut belum aktif dan tidak dapat digunakan untuk transaksi nyata.</p><div className="feature-grid" style={{marginTop:16}}>{paymentMethods.map((method) => <article className="feature-card" key={method} style={{minHeight:0}}><div className="feature-icon">▦</div><h3>{method}</h3><p>Menunggu pemilihan provider, konfigurasi, webhook terverifikasi, dan pengujian.</p></article>)}</div></section>
        <div className="cta" style={{marginTop:38}}><div className="section-kicker">JELAJAHI BAGISAWER</div><h2>Mulai dari halaman kreator.</h2><p>Profil publik dan pratinjau dukungan sudah tersedia untuk melihat bentuk antarmukanya. Checkout nyata tetap dinonaktifkan.</p><div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}><Link className="btn btn-primary" href="/register">Buat akun ↗</Link><Link className="btn btn-ghost" href="/explore">Jelajahi kreator ↗</Link></div></div>
      </section>
      <footer className="footer"><Link href="/">← Kembali ke beranda</Link></footer>
    </main>
  );
}