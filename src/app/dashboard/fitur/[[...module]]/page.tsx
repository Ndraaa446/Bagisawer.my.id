import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FeatureOverlayLinks } from "@/components/feature-overlay-links";

type Feature = { slug: string; icon: string; title: string; description: string; group: string; overlay?: boolean; status?: string };
const features: Feature[] = [
  { slug: "saweran", icon: "♡", title: "Saweran standar", description: "Nominal dukungan, nama atau anonim, dan pesan untuk kreator.", group: "Donasi", overlay: true, status: "UI direncanakan" },
  { slug: "anonim", icon: "◌", title: "Dukungan anonim", description: "Sembunyikan identitas pendukung dari halaman, feed, dan overlay.", group: "Donasi", overlay: true },
  { slug: "pesan", icon: "✉", title: "Pesan dukungan", description: "Moderasi pesan, batas karakter, filter, dan tampilan alert.", group: "Donasi", overlay: true },
  { slug: "target", icon: "◎", title: "Target dukungan", description: "Target nominal, progres, milestone, dan widget progres.", group: "Donasi", overlay: true },
  { slug: "mediashare", icon: "▶", title: "Mediashare", description: "Antrean video dengan batas durasi, validasi URL, dan moderasi.", group: "Donasi", overlay: true, status: "Butuh proteksi URL" },
  { slug: "voicenote", icon: "♫", title: "Voice note", description: "Kirim suara dengan batas ukuran, durasi, dan persetujuan kreator.", group: "Donasi", overlay: true },
  { slug: "lagu", icon: "♪", title: "Request lagu", description: "Antrean permintaan lagu melalui layanan yang diizinkan.", group: "Donasi", overlay: true, status: "Butuh integrasi resmi" },
  { slug: "qris", icon: "▦", title: "QR dukungan", description: "QR menuju halaman dukungan Bagisawer, bukan QR pembayaran palsu.", group: "Donasi", overlay: true },
  { slug: "leaderboard", icon: "♜", title: "Leaderboard", description: "Peringkat harian, mingguan, bulanan, dan sepanjang waktu; hormati anonim.", group: "Interaksi", overlay: true },
  { slug: "subathon", icon: "◷", title: "Subathon timer", description: "Timer server-authoritative, tambahan waktu, batas maksimum, dan histori.", group: "Interaksi", overlay: true },
  { slug: "running-text", icon: "≋", title: "Running text", description: "Teks berjalan dengan pengaturan kecepatan, durasi, dan moderasi.", group: "Interaksi", overlay: true },
  { slug: "soundboard", icon: "◖", title: "Soundboard", description: "Suara dan trigger dengan batas volume, frekuensi, serta izin kreator.", group: "Interaksi", overlay: true },
  { slug: "polling", icon: "☷", title: "Polling", description: "Voting dengan batas per pengguna, tenggat, hasil real-time, dan moderasi.", group: "Interaksi", overlay: true },
  { slug: "vip-queue", icon: "✦", title: "VIP queue", description: "Antrean prioritas dengan aturan yang transparan dan dapat diaudit.", group: "Interaksi", overlay: true },
  { slug: "bagpao", icon: "✿", title: "Bagpao", description: "Modul interaksi yang perlu spesifikasi produk sebelum perilakunya ditetapkan.", group: "Interaksi", overlay: true, status: "Butuh spesifikasi" },
  { slug: "gachaton", icon: "✧", title: "Gachaton", description: "Animasi dan histori hasil; fitur berhadiah/uang perlu tinjauan hukum dan keamanan.", group: "Interaksi", overlay: true, status: "Butuh tinjauan" },
  { slug: "bidcoin", icon: "◈", title: "Bidcoin", description: "Poin internal dengan aturan penggunaan, histori, dan batas yang jelas.", group: "Interaksi", overlay: true },
  { slug: "store", icon: "▣", title: "Store & voucher", description: "Katalog, stok, pesanan, pemenuhan, voucher, refund, dan laporan.", group: "Ekosistem", status: "Butuh supplier API" },
  { slug: "notifikasi", icon: "♧", title: "Notifikasi", description: "Pusat notifikasi dalam aplikasi, email, status, dan preferensi.", group: "Ekosistem", status: "Butuh integrasi email" },
  { slug: "kompetisi", icon: "♛", title: "Kompetisi & klip", description: "Pengiriman klip, aturan kompetisi, penilaian, hasil, dan pelaporan.", group: "Ekosistem" },
];

const paymentMethods = [
  { name: "QRIS", detail: "QR pembayaran dinamis dari provider", category: "QR & instan" },
  { name: "Virtual Account", detail: "BCA, BNI, BRI, Mandiri, Permata, dan bank lain sesuai provider", category: "Transfer bank" },
  { name: "Transfer bank", detail: "Instruksi transfer dan rekonsiliasi otomatis bila didukung", category: "Transfer bank" },
  { name: "Mobile/online banking", detail: "Pembayaran melalui kanal bank yang didukung provider", category: "Perbankan digital" },
  { name: "GoPay", detail: "E-wallet; ketersediaan mengikuti provider", category: "E-wallet" },
  { name: "DANA", detail: "E-wallet; ketersediaan mengikuti provider", category: "E-wallet" },
  { name: "OVO", detail: "E-wallet; ketersediaan mengikuti provider", category: "E-wallet" },
  { name: "ShopeePay", detail: "E-wallet; ketersediaan mengikuti provider", category: "E-wallet" },
  { name: "LinkAja", detail: "E-wallet; ketersediaan mengikuti provider", category: "E-wallet" },
  { name: "Kartu debit/kredit", detail: "Hanya melalui halaman checkout provider yang sesuai standar keamanan", category: "Kartu" },
  { name: "Gerai retail", detail: "Kode pembayaran di gerai jika provider mendukung", category: "Tunai di gerai" },
];

const overlayTypes = features.filter((feature) => feature.overlay);
const sections = [
  { slug: "ringkasan", title: "Pusat fitur", icon: "⌂" },
  { slug: "donasi", title: "Donasi & dukungan", icon: "♡" },
  { slug: "pembayaran", title: "Metode pembayaran", icon: "▦" },
  { slug: "overlay", title: "Overlay per fitur", icon: "▣" },
  { slug: "interaksi", title: "Interaksi livestream", icon: "✦" },
  { slug: "ekosistem", title: "Ekosistem kreator", icon: "◈" },
  { slug: "keuangan", title: "Keuangan & pencairan", icon: "Rp" },
  { slug: "analitik", title: "Analitik & laporan", icon: "▥" },
  { slug: "notifikasi", title: "Notifikasi", icon: "♧" },
  { slug: "moderasi", title: "Moderasi & admin", icon: "⚑" },
  { slug: "pengaturan", title: "Pengaturan akun", icon: "⚙" },
];

function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "green" | "amber" }) {
  return <span className={`tool-badge tool-badge-${tone}`}>{children}</span>;
}

export default async function CreatorFeatureCenter({ params }: { params: Promise<{ module?: string[] }> }) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const routeParams = await params;
  const current = routeParams.module?.[0] ?? "ringkasan";
  const title = sections.find((item) => item.slug === current)?.title ?? "Pusat fitur";
  const visibleFeatures = current === "donasi" ? features.filter((feature) => feature.group === "Donasi")
    : current === "interaksi" ? features.filter((feature) => feature.group === "Interaksi")
    : current === "ekosistem" ? features.filter((feature) => feature.group === "Ekosistem")
    : current === "overlay" ? overlayTypes : features;

  return (
    <main className="wrap dashboard-page tool-center">
      <style>{`
        .tool-center{padding-bottom:64px}.tool-topbar{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:76px;border-bottom:1px solid #ffffff12}.tool-top-actions{display:flex;gap:8px;flex-wrap:wrap}.tool-hero{padding:38px 0 24px}.tool-eyebrow{color:#c4b5fd;font-size:11px;letter-spacing:1.7px;font-weight:800;text-transform:uppercase}.tool-title{font-size:clamp(28px,4vw,42px);letter-spacing:-1.5px;line-height:1.12;margin:10px 0}.tool-lead{max-width:800px;color:var(--muted);font-size:14px;line-height:1.8}.tool-notice{display:flex;gap:12px;align-items:flex-start;border:1px solid #fbbf2440;background:#fbbf240b;padding:15px 17px;border-radius:14px;color:#f8e7ba;font-size:12px;line-height:1.7;margin:18px 0 25px}.tool-nav{display:flex;gap:8px;flex-wrap:wrap;margin:22px 0 28px}.tool-nav a{border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-size:12px;color:var(--muted);background:#ffffff04}.tool-nav a.active,.tool-nav a:hover{border-color:#a78bfa70;background:#a78bfa15;color:#f5efff}.tool-section-head{display:flex;align-items:end;justify-content:space-between;gap:16px;margin:28px 0 14px}.tool-section-head h2{font-size:23px;margin:0 0 5px;letter-spacing:-.7px}.tool-section-head p{font-size:12px;color:var(--muted);margin:0;line-height:1.7}.tool-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.tool-card{border:1px solid #ffffff12;background:linear-gradient(145deg,#1b1727,#13111b);border-radius:15px;padding:18px;min-width:0}.tool-card-top{display:flex;gap:12px;align-items:flex-start}.tool-icon{width:38px;height:38px;flex:0 0 38px;display:grid;place-items:center;border-radius:12px;background:#a78bfa17;color:#d9ccff;font-size:19px}.tool-card h3{font-size:15px;margin:2px 0 6px}.tool-card p{font-size:12px;line-height:1.7;color:var(--muted);margin:0 0 13px}.tool-card .tool-badge{margin-top:9px}.tool-badge{display:inline-flex;align-items:center;border-radius:99px;padding:4px 8px;font-size:10px;font-weight:700;border:1px solid #ffffff12;color:#c9c3d8;background:#ffffff06}.tool-badge-green{color:#a7f3d0;border-color:#34d39935;background:#34d39910}.tool-badge-amber{color:#fde68a;border-color:#fbbf2435;background:#fbbf2410}.tool-card-footer{border-top:1px solid #ffffff10;padding-top:12px;margin-top:13px;display:flex;align-items:center;justify-content:space-between;gap:10px}.tool-card-footer small{font-size:10px;color:#8f88a2}.tool-card-footer a,.tool-card-footer button{border:1px solid #a78bfa45;background:#a78bfa10;color:#e9d5ff;border-radius:9px;padding:8px 10px;font-size:11px;font-weight:700}.tool-card-footer button:disabled{opacity:.55;cursor:not-allowed}.tool-methods{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.tool-method{display:flex;gap:12px;align-items:flex-start;padding:15px;border:1px solid #ffffff12;background:#ffffff03;border-radius:13px}.tool-method-mark{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:#a78bfa15;color:#c4b5fd;flex:0 0 34px}.tool-method strong{font-size:13px;display:block;margin:1px 0 5px}.tool-method p{font-size:11px;color:var(--muted);line-height:1.6;margin:0}.tool-overlay-url{display:flex;flex-direction:column;gap:7px;background:#0d0b13;border:1px solid #ffffff12;border-radius:10px;padding:10px;margin-top:12px}.tool-overlay-url code{font-size:10px;overflow-wrap:anywhere;color:#d9ccff}.tool-overlay-url small{font-size:10px;color:var(--muted);line-height:1.5}.tool-empty{border:1px dashed #ffffff24;border-radius:14px;padding:22px;color:var(--muted);font-size:12px;line-height:1.7}.tool-summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:22px 0}.tool-summary{border:1px solid #ffffff12;background:#ffffff04;border-radius:13px;padding:15px}.tool-summary strong{display:block;font-family:'Space Grotesk',sans-serif;font-size:25px;margin-bottom:5px}.tool-summary span{font-size:11px;color:var(--muted)}.tool-footer{border-top:1px solid #ffffff10;margin-top:38px;padding-top:18px;color:#817a94;font-size:11px;line-height:1.7}.tool-list{display:grid;gap:10px}.tool-row{display:flex;align-items:center;gap:12px;padding:14px;border:1px solid #ffffff12;border-radius:12px;background:#ffffff03}.tool-row-main{flex:1;min-width:0}.tool-row strong{font-size:13px;display:block;margin-bottom:4px}.tool-row p{font-size:11px;color:var(--muted);margin:0;line-height:1.6}.tool-row .tool-row-status{white-space:nowrap}.tool-center .brand{font-size:20px}@media(max-width:850px){.tool-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.tool-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.tool-center{width:calc(100% - 28px)}.tool-topbar{align-items:flex-start;padding:16px 0;flex-direction:column}.tool-grid,.tool-methods{grid-template-columns:1fr}.tool-section-head{align-items:flex-start;flex-direction:column}.tool-row{align-items:flex-start;flex-wrap:wrap}.tool-row-status{margin-left:50px}.tool-summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
      `}</style>
      <header className="tool-topbar">
        <Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link>
        <div className="tool-top-actions"><Link className="btn btn-ghost" href="/dashboard">Dashboard</Link><Link className="btn btn-ghost" href="/dashboard/streaming">Livestream & OBS</Link><Link className="btn btn-primary" href="/dashboard/payments/sandbox">Sandbox uji</Link></div>
      </header>

      <section className="tool-hero">
        <div className="tool-eyebrow">CREATOR WORKSPACE · ROADMAP FITUR</div>
        <h1 className="tool-title">{title}</h1>
        <p className="tool-lead">Pusat pengaturan seluruh fitur Bagisawer. Tampilan ini menyusun modul, pilihan metode pembayaran, dan kebutuhan overlay agar tiap fitur memiliki pengaturan dan tautan sendiri. Integrasi yang belum tersedia ditandai dengan jelas dan tidak menerima pembayaran nyata.</p>
        <div className="tool-summary-grid">
          <div className="tool-summary"><strong>{features.length}</strong><span>Modul produk terdaftar</span></div>
          <div className="tool-summary"><strong>{overlayTypes.length}</strong><span>Jenis overlay direncanakan</span></div>
          <div className="tool-summary"><strong>{paymentMethods.length}</strong><span>Metode pembayaran dipetakan</span></div>
          <div className="tool-summary"><strong>0</strong><span>Provider pembayaran aktif</span></div>
        </div>
        <div className="tool-notice"><span aria-hidden="true">ⓘ</span><div><strong>Mode perancangan UI.</strong> Belum ada provider pembayaran eksternal yang dipilih. QRIS, bank, e-wallet, kartu, dan gerai di bawah adalah katalog target integrasi, bukan metode aktif. Jangan meminta atau mengirim uang melalui halaman ini.</div></div>
      </section>

      <nav className="tool-nav" aria-label="Kategori pusat fitur">
        {sections.map((section) => <Link key={section.slug} className={current === section.slug ? "active" : ""} href={section.slug === "ringkasan" ? "/dashboard/fitur" : `/dashboard/fitur/${section.slug}`}>{section.icon} {section.title}</Link>)}
      </nav>

      {current === "keuangan" ? (
        <>
          <div className="tool-section-head"><div><h2>Keuangan kreator</h2><p>Saldo dan transaksi akan berasal dari ledger terverifikasi; tidak ada saldo demo yang ditampilkan sebagai uang nyata.</p></div><Badge tone="amber">Belum aktif</Badge></div>
          <div className="tool-summary-grid"><div className="tool-summary"><strong>—</strong><span>Saldo tersedia</span></div><div className="tool-summary"><strong>—</strong><span>Saldo tertahan</span></div><div className="tool-summary"><strong>—</strong><span>Total dukungan</span></div><div className="tool-summary"><strong>—</strong><span>Biaya platform</span></div></div>
          <div className="tool-section-head"><div><h2>Riwayat transaksi</h2><p>Filter tanggal, status, metode, pencarian referensi, dan ekspor setelah backend keuangan siap.</p></div></div>
          <div className="tool-empty">Belum ada transaksi produksi untuk ditampilkan. Data sandbox dipisahkan dan tidak dianggap sebagai saldo nyata.</div>
          <div className="tool-section-head"><div><h2>Pencairan dana</h2><p>Formulir rekening, pemeriksaan kelayakan, persetujuan, status, dan rekonsiliasi provider.</p></div></div>
          <div className="tool-empty">Permintaan pencairan dinonaktifkan sampai provider pembayaran, kebijakan verifikasi, dan alur ledger siap diuji.</div>
        </>
      ) : current === "analitik" ? (
        <>
          <div className="tool-section-head"><div><h2>Analitik & laporan</h2><p>Grafik dukungan, tren periode, sumber event, performa overlay, dan ekspor laporan.</p></div><Badge>Kerangka UI</Badge></div>
          <div className="tool-grid">{[{title:"Tren dukungan",description:"Grafik harian/mingguan/bulanan dengan filter rentang waktu."},{title:"Sumber dukungan",description:"Rincian metode pembayaran dan kanal event setelah provider terhubung."},{title:"Performa alert",description:"Jumlah event, waktu antre, event gagal, dan status koneksi overlay."}].map((item) => <article className="tool-card" key={item.title}><div className="tool-icon">▥</div><h3>{item.title}</h3><p>{item.description}</p><Badge>Menunggu data terverifikasi</Badge></article>)}</div>
          <div className="tool-empty">Grafik belum menampilkan angka contoh agar data ilustrasi tidak tertukar dengan transaksi sungguhan.</div>
        </>
      ) : current === "notifikasi" ? (
        <>
          <div className="tool-section-head"><div><h2>Pusat notifikasi</h2><p>Notifikasi pembayaran, keamanan akun, status pencairan, dan pembaruan fitur.</p></div><Badge>Kerangka UI</Badge></div>
          <div className="tool-empty"><strong>Belum ada notifikasi.</strong><br/>Notifikasi akan muncul di sini setelah sistem event, email, dan preferensi pengguna terhubung. Tidak ada notifikasi dummy yang dibuat seolah-olah nyata.</div>
          <div className="tool-section-head"><div><h2>Preferensi notifikasi</h2><p>Pengaturan email dan notifikasi dalam aplikasi.</p></div></div>
          <div className="tool-grid">{["Dukungan berhasil","Perubahan keamanan akun","Pencairan dan refund","Pembaruan produk"].map((item) => <article className="tool-card" key={item}><div className="tool-card-top"><span className="tool-icon">♧</span><div><h3>{item}</h3><Badge>Belum terhubung</Badge></div></div><p>Preferensi dapat dikonfigurasi setelah layanan notifikasi tersedia.</p></article>)}</div>
        </>
      ) : current === "moderasi" ? (
        <>
          <div className="tool-section-head"><div><h2>Moderasi & admin</h2><p>Area staf harus memakai role server-side, audit trail, dan akses minimum; bukan sekadar menyembunyikan tombol.</p></div><Badge tone="amber">Role admin belum lengkap</Badge></div>
          <div className="tool-grid">{[{title:"Laporan pengguna",description:"Daftar laporan, prioritas, status, dan catatan moderator."},{title:"Moderasi pesan/media",description:"Tinjau pesan dukungan, voice note, video, dan permintaan lagu."},{title:"Manajemen kreator",description:"Status profil, pembatasan akun, dan histori tindakan yang dapat diaudit."},{title:"Transaksi & refund",description:"Pencarian referensi, sengketa, refund, dan rekonsiliasi oleh petugas berizin."},{title:"Biaya & kebijakan",description:"Konfigurasi biaya platform dan batas yang berversi."},{title:"Audit log",description:"Siapa melakukan tindakan apa, kapan, dan alasan tindakan."}].map((item) => <article className="tool-card" key={item.title}><div className="tool-icon">⚑</div><h3>{item.title}</h3><p>{item.description}</p><Badge tone="amber">Menunggu RBAC backend</Badge></article>)}</div>
        </>
      ) : current === "pengaturan" ? (
        <>
          <div className="tool-section-head"><div><h2>Pengaturan kreator</h2><p>Profil, tema, halaman publik, keamanan akun, dan pengaturan siaran.</p></div></div>
          <div className="tool-grid"><article className="tool-card"><div className="tool-icon">◉</div><h3>Profil & halaman publik</h3><p>Username, nama tampilan, bio, status publik, dan pratinjau halaman.</p><div className="tool-card-footer"><small>Editor profil</small><Link href="/dashboard">Buka profil ↗</Link></div></article><article className="tool-card"><div className="tool-icon">▣</div><h3>Livestream & OBS</h3><p>Ambang alert, durasi, tema, suara, dan token overlay umum.</p><div className="tool-card-footer"><small>Pengaturan streaming</small><Link href="/dashboard/streaming">Buka OBS ↗</Link></div></article><article className="tool-card"><div className="tool-icon">⚙</div><h3>Keamanan akun</h3><p>Kelola sesi, kata sandi, dan preferensi keamanan. Alur email masih menunggu pengujian end-to-end.</p><div className="tool-card-footer"><small>Autentikasi</small><Link href="/login">Halaman masuk ↗</Link></div></article></div>
        </>
      ) : current === "pembayaran" ? (
        <>
          <div className="tool-section-head"><div><h2>Metode pembayaran yang perlu disiapkan</h2><p>Provider belum dipilih; setiap metode baru aktif setelah adapter, webhook, dan rekonsiliasi lulus uji.</p></div><Badge tone="amber">Belum aktif</Badge></div>
          <div className="tool-methods">{paymentMethods.map((method) => <article className="tool-method" key={method.name}><span className="tool-method-mark">▦</span><div><strong>{method.name}</strong><p>{method.detail}</p><Badge>{method.category}</Badge><div style={{marginTop:8}}><Badge tone="amber">Menunggu provider</Badge></div></div></article>)}</div>
          <div className="tool-section-head"><div><h2>Alur finansial yang wajib ada</h2><p>Halaman dan status yang akan terlihat setelah integrasi pembayaran.</p></div></div>
          <div className="tool-list">{["Pilih metode dan buat transaksi pending","Checkout provider dengan referensi unik","Status menunggu, berhasil, gagal, kedaluwarsa, refund","Webhook bertanda tangan dan deduplikasi event","Ledger seimbang, biaya platform, saldo tertahan/tersedia","Permintaan pencairan, verifikasi, persetujuan, rekonsiliasi"].map((item, index) => <div className="tool-row" key={item}><span className="tool-icon">{String(index + 1).padStart(2, "0")}</span><div className="tool-row-main"><strong>{item}</strong><p>Bagian ini masuk implementasi backend setelah UI seluruh produk disusun.</p></div><span className="tool-row-status"><Badge>Belum lengkap</Badge></span></div>)}</div>
        </>
      ) : current === "overlay" ? (
        <>
          <div className="tool-section-head"><div><h2>Satu fitur, satu overlay</h2><p>Setiap modul di bawah mempunyai slot tautan sendiri. Token unik dan endpoint per jenis akan diaktifkan pada tahap backend; tautan contoh sengaja tidak dibuat seolah-olah sudah bisa dipakai di OBS.</p></div><Badge tone="amber">Token per fitur belum aktif</Badge></div>
          <FeatureOverlayLinks features={overlayTypes} />
        </>
      ) : current === "donasi" || current === "interaksi" || current === "ekosistem" ? (
        <>
          <div className="tool-section-head"><div><h2>{title}</h2><p>Setiap modul memiliki halaman pengaturan, validasi, status, dan pengujian tersendiri sebelum diaktifkan.</p></div><Badge>{visibleFeatures.length} modul</Badge></div>
          <div className="tool-grid">{visibleFeatures.map((feature) => <article className="tool-card" key={feature.slug}><div className="tool-card-top"><span className="tool-icon">{feature.icon}</span><div><h3>{feature.title}</h3><Badge>{feature.group}</Badge></div></div><p>{feature.description}</p><Badge tone={feature.status ? "amber" : "muted"}>{feature.status ?? "Menunggu implementasi alur"}</Badge><div className="tool-card-footer"><small>Modul: {feature.slug}</small><Link href={`/dashboard/fitur/overlay#${feature.slug}`}>Kebutuhan overlay ↗</Link></div></article>)}</div>
        </>
      ) : (
        <>
          <div className="tool-section-head"><div><h2>Semua modul dalam satu peta kerja</h2><p>Susunan tampilan produk sebelum pengujian alur menyeluruh.</p></div><Badge tone="green">Inventaris tersusun</Badge></div>
          <div className="tool-grid">{features.map((feature) => <article className="tool-card" key={feature.slug}><div className="tool-card-top"><span className="tool-icon">{feature.icon}</span><div><h3>{feature.title}</h3><Badge>{feature.group}</Badge></div></div><p>{feature.description}</p><Badge tone={feature.status ? "amber" : "muted"}>{feature.status ?? "Direncanakan"}</Badge><div className="tool-card-footer"><small>{feature.overlay ? "Memerlukan overlay khusus" : "Modul dashboard"}</small><Link href={feature.group === "Donasi" ? "/dashboard/fitur/donasi" : feature.group === "Interaksi" ? "/dashboard/fitur/interaksi" : "/dashboard/fitur/ekosistem"}>Lihat modul ↗</Link></div></article>)}</div>
          <div className="tool-section-head"><div><h2>Metode pembayaran</h2><p>Daftar target integrasi; tidak ada provider aktif.</p></div><Link className="btn btn-ghost" href="/dashboard/fitur/pembayaran">Lihat semua metode ↗</Link></div>
          <div className="tool-methods">{paymentMethods.slice(0, 4).map((method) => <article className="tool-method" key={method.name}><span className="tool-method-mark">▦</span><div><strong>{method.name}</strong><p>{method.detail}</p><div style={{marginTop:8}}><Badge tone="amber">Belum aktif</Badge></div></div></article>)}</div>
          <div className="tool-section-head"><div><h2>Overlay khusus per fitur</h2><p>Jangan gunakan satu token bersama untuk semua jenis event.</p></div><Link className="btn btn-ghost" href="/dashboard/fitur/overlay">Kelola daftar overlay ↗</Link></div>
          <div className="tool-empty">Token unik per fitur, rotasi/pencabutan, dan filter antrean dasar sudah tersedia. Modul penghasil event khusus seperti media share, voice note, lagu, target, dan polling masih harus diimplementasikan sebelum masing-masing overlay menerima event produksi.</div>
        </>
      )}
      <footer className="tool-footer">Bagisawer · UI dan katalog produk ini bukan bukti bahwa seluruh integrasi sudah aktif. Pembayaran nyata, pencairan, pemutaran media, dan integrasi eksternal tetap nonaktif sampai backend, keamanan, dan pengujian end-to-end selesai. <Link href="/dashboard/streaming">Pengaturan OBS yang sudah ada ↗</Link></footer>
    </main>
  );
}
