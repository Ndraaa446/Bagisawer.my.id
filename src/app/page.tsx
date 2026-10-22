import Link from "next/link";

const features = [
  { icon: "♡", title: "Halaman sawer personal", text: "Satu tautan untuk komunitas mendukung kreator, lengkap dengan pesan dan pilihan anonim." },
  { icon: "↗", title: "Alert livestream", text: "Rancang pengalaman alert yang selaras dengan siaran dan identitas channel kamu." },
  { icon: "▤", title: "Dashboard kreator", text: "Pantau aktivitas dukungan dan kelola pengaturan kreator dari satu tempat." },
  { icon: "◎", title: "Overlay untuk OBS", text: "Siapkan browser source dengan kontrol dan token overlay yang bisa dikelola." },
  { icon: "✦", title: "Interaksi komunitas", text: "Ruang untuk target dukungan, polling, leaderboard, dan fitur interaktif lainnya." },
  { icon: "⌁", title: "Dibuat untuk Indonesia", text: "Pengalaman berbahasa Indonesia dengan alur yang dirancang sederhana dan jelas." }
];

export default function HomePage() {
  return (
    <main>
      <header className="wrap nav">
        <Link href="/" className="brand" aria-label="Bagisawer beranda"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link>
        <nav className="nav-links" aria-label="Navigasi utama">
          <a href="#fitur">Fitur</a><a href="#cara-kerja">Cara kerja</a><a href="#kreator">Untuk kreator</a>
        </nav>
        <div className="nav-actions"><Link className="btn btn-ghost" href="/login">Masuk</Link><Link className="btn btn-primary" href="/register">Mulai sekarang <span aria-hidden="true">↗</span></Link></div>
      </header>

      <section className="wrap hero">
        <div className="eyebrow"><span className="dot" /> RUANG DUKUNGAN UNTUK KREATOR INDONESIA</div>
        <h1>Karyamu berarti.<br/><span className="gradient-text">Dukungan mereka juga.</span></h1>
        <p className="hero-copy">Bangun koneksi yang lebih dekat dengan komunitasmu. Satu halaman untuk menerima dukungan, merayakan momen livestream, dan tumbuh bersama.</p>
        <div className="hero-actions"><Link href="/register" className="btn btn-primary">Buat halaman kreator <span aria-hidden="true">→</span></Link><a href="#fitur" className="btn btn-ghost">Jelajahi fitur <span aria-hidden="true">↓</span></a></div>
        <p className="trust">Gratis untuk mulai · Pengaturan transparan · Dibangun untuk komunitas</p>

        <div className="preview-shell" aria-label="Pratinjau antarmuka Bagisawer">
          <div className="preview"><div className="preview-top"><span className="window-dot"/><span className="window-dot"/><span className="window-dot"/><span style={{marginLeft:10}}>app.bagisawer.id / creator</span><span style={{marginLeft:"auto"}}>● Pratinjau UI</span></div>
            <div className="preview-body">
              <div className="creator-card">
                <div className="creator-head"><div className="avatar">N</div><div><div className="creator-name">Nara Studio</div><div className="creator-sub">@narastudio · Kreator</div></div><span className="live-tag">● CREATOR</span></div>
                <div className="preview-label">Pilih nominal dukungan</div>
                <div className="amounts"><div className="amount">Rp10.000</div><div className="amount active">Rp25.000</div><div className="amount">Rp50.000</div></div>
                <div className="mock-input">Nama kamu (opsional)</div><div className="mock-input">Tulis pesan untuk kreator…</div><div className="mock-pay">Lanjutkan dukungan ↗</div>
                <p style={{fontSize:10,color:"#817a94",margin:"12px 0 0",textAlign:"center"}}>Ilustrasi antarmuka · Bukan transaksi nyata</p>
              </div>
              <div className="stats">
                <div className="stat-card"><div className="stat-kicker">Dukungan bulan ini</div><div className="stat-value">Rp2,45 jt</div><div className="stat-note">↗ Contoh tampilan</div></div>
                <div className="stat-card"><div className="stat-kicker">Dukungan masuk</div><div className="stat-value">128</div><div className="stat-note">✦ Data ilustrasi</div></div>
                <div className="activity"><div className="stat-kicker">Aktivitas terbaru · ilustrasi</div>
                  <div className="activity-row"><span className="activity-icon">♡</span><span><b>Teman komunitas</b><small>Semangat terus berkarya!</small></span><strong>Rp50 rb</strong></div>
                  <div className="activity-row"><span className="activity-icon">✦</span><span><b>Pendukung anonim</b><small>Kontenmu keren banget</small></span><strong>Rp25 rb</strong></div>
                  <div className="activity-row"><span className="activity-icon">↗</span><span><b>Komunitas kamu</b><small>Mampir mendukung</small></span><strong>Rp10 rb</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="fitur"><div className="wrap"><div className="section-head"><div className="section-kicker">Satu platform, banyak kemungkinan</div><h2>Semua yang dibutuhkan kreator,<br/><span className="gradient-text">dirancang lebih sederhana.</span></h2><p>Mulai dari halaman dukungan hingga alat bantu livestream, bangun pengalaman yang terasa milikmu sendiri.</p></div>
        <div className="feature-grid">{features.map((feature) => <article className="feature-card" key={feature.title}><div className="feature-icon" aria-hidden="true">{feature.icon}</div><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div>
      </div></section>

      <section className="section" id="cara-kerja"><div className="wrap"><div className="section-head"><div className="section-kicker">Mulai dalam beberapa langkah</div><h2>Dari kreator, untuk komunitas.</h2><p>Alur yang jelas untuk membangun halaman dukungan dan membagikannya kepada penonton.</p></div>
        <div className="steps"><article className="step-card"><div className="step-num">LANGKAH 01</div><h3>Buat akun kreator</h3><p>Siapkan profil, username, dan cerita singkat tentang karya yang kamu buat.</p></article><article className="step-card"><div className="step-num">LANGKAH 02</div><h3>Personalisasi halaman</h3><p>Atur tampilan halaman dan preferensi dukungan sesuai kebutuhan komunitasmu.</p></article><article className="step-card"><div className="step-num">LANGKAH 03</div><h3>Bagikan dan terhubung</h3><p>Bagikan tautanmu. Kelola interaksi dan pantau dukungan melalui dashboard.</p></article></div>
      </div></section>

      <section className="wrap" id="kreator"><div className="cta"><div className="section-kicker">Langkah berikutnya dimulai di sini</div><h2>Siap tumbuh bersama komunitasmu?</h2><p>Buat identitas kreatormu di Bagisawer dan mulai siapkan ruang dukunganmu.</p><Link className="btn btn-primary" href="/register">Mulai bangun halamanmu <span aria-hidden="true">→</span></Link></div></section>

      <footer className="footer"><div className="wrap footer-inner"><Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link><div>© {new Date().getFullYear()} Bagisawer. Dibuat untuk kreator dan komunitas.</div><nav className="footer-links" aria-label="Tautan footer"><Link href="/features">Fitur</Link><Link href="/docs">Dokumentasi</Link><Link href="/privacy">Privasi</Link><Link href="/terms">Ketentuan</Link><Link href="/support">Bantuan</Link></nav></div></footer>
    </main>
  );
}