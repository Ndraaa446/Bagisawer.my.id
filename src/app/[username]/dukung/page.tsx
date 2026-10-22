"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Creator = { username: string; display_name: string; bio: string | null; avatar_url: string | null };
const methods = [
  { id: "qris", name: "QRIS", detail: "Satu kode untuk aplikasi pembayaran yang mendukung" },
  { id: "va", name: "Virtual Account", detail: "VA bank sesuai dukungan provider" },
  { id: "bank", name: "Transfer bank", detail: "Instruksi transfer dan konfirmasi terverifikasi" },
  { id: "gopay", name: "GoPay", detail: "Dompet digital" },
  { id: "dana", name: "DANA", detail: "Dompet digital" },
  { id: "ovo", name: "OVO", detail: "Dompet digital" },
  { id: "shopeepay", name: "ShopeePay", detail: "Dompet digital" },
  { id: "linkaja", name: "LinkAja", detail: "Dompet digital" },
  { id: "card", name: "Kartu debit/kredit", detail: "Checkout aman melalui provider" },
  { id: "retail", name: "Gerai retail", detail: "Kode pembayaran jika tersedia" },
];
const amounts = [10000, 25000, 50000, 100000];

export default function CreatorSupportPage() {
  const params = useParams<{ username: string }>();
  const username = (params?.username ?? "").toLowerCase();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(25000);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [method, setMethod] = useState("qris");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("creator_profiles")
          .select("username, display_name, bio, avatar_url")
          .eq("username", username)
          .eq("is_public", true)
          .maybeSingle();
        if (!cancelled && data) setCreator(data as Creator);
      } catch {
        if (!cancelled) setCreator(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (username) void load();
    return () => { cancelled = true; };
  }, [username]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Checkout belum aktif: Bagisawer belum menghubungkan penyedia pembayaran. Tidak ada transaksi atau penarikan uang yang dibuat. Pilihan metode di halaman ini hanya pratinjau UI.");
  }

  const selectedAmount = customAmount.trim() ? Number(customAmount) : amount;
  const formatIDR = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

  return (
    <main className="support-page">
      <style>{`
        .support-page{min-height:100vh;padding:0 0 50px;background:radial-gradient(ellipse at 50% -10%,#2c1c4b 0,transparent 45%),var(--bg)}.support-wrap{width:min(1050px,calc(100% - 36px));margin:0 auto}.support-nav{height:76px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff12}.support-layout{display:grid;grid-template-columns:.82fr 1.18fr;gap:20px;padding:38px 0}.support-creator,.support-form-card{border:1px solid #ffffff12;background:linear-gradient(145deg,#1b1727,#13111b);border-radius:18px;padding:24px;height:max-content}.support-creator{text-align:center;position:sticky;top:20px}.support-avatar{width:78px;height:78px;border-radius:24px;display:grid;place-items:center;background:linear-gradient(145deg,#c4b5fd,#7c3aed);font-size:30px;font-weight:800;margin:0 auto 15px}.support-kicker{font-size:10px;letter-spacing:1.7px;font-weight:800;color:#c4b5fd;text-transform:uppercase}.support-creator h1{font-size:27px;letter-spacing:-1px;line-height:1.2;margin:10px 0}.support-handle{font-size:12px;color:#a7a1b8}.support-bio{font-size:13px;color:#a7a1b8;line-height:1.8;margin:16px 0}.support-note{border-top:1px solid #ffffff12;padding-top:15px;color:#8f88a2;font-size:11px;line-height:1.7;text-align:left}.support-form-card h2{font-size:24px;letter-spacing:-.7px;margin:7px 0}.support-intro{font-size:12px;color:#a7a1b8;line-height:1.7;margin-bottom:22px}.support-field{display:grid;gap:7px;margin:17px 0}.support-field label,.support-label{font-size:12px;font-weight:700;color:#e7e2f1}.support-field input,.support-field textarea{width:100%;border:1px solid #383146;background:#0f0d15;color:#f8f7fc;border-radius:10px;padding:12px;font:inherit;font-size:13px;outline:none}.support-field input:focus,.support-field textarea:focus{border-color:#a78bfa}.support-amounts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.support-amount{border:1px solid #383146;border-radius:10px;background:#ffffff04;color:#e7e2f1;padding:12px 5px;font-size:12px}.support-amount.active{border-color:#a78bfa;background:#a78bfa20;color:#e9d5ff}.support-methods{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.support-method{display:flex;align-items:flex-start;gap:10px;text-align:left;padding:12px;border:1px solid #383146;border-radius:11px;background:#ffffff03;color:#f8f7fc;min-width:0}.support-method.active{border-color:#a78bfa;background:#a78bfa12}.support-method input{accent-color:#a78bfa;margin-top:3px}.support-method strong{font-size:12px;display:block}.support-method small{display:block;color:#a7a1b8;font-size:10px;line-height:1.5;margin-top:4px}.support-method em{font-style:normal;font-size:9px;color:#fde68a;display:block;margin-top:5px}.support-toggle{display:flex;gap:10px;align-items:flex-start;font-size:12px;line-height:1.6;color:#c8c2d5}.support-toggle input{accent-color:#a78bfa;margin-top:3px}.support-submit{width:100%;padding:14px;border:0;border-radius:11px;background:linear-gradient(100deg,#a78bfa,#7c3aed);color:white;font-weight:800;margin-top:8px}.support-notice{padding:13px;border:1px solid #fbbf2440;border-radius:11px;background:#fbbf240b;color:#fde68a;font-size:11px;line-height:1.7;margin:14px 0 0}.support-loading{max-width:500px;margin:90px auto;text-align:center;color:#a7a1b8;line-height:1.8}.support-error{max-width:500px;margin:90px auto;text-align:center;border:1px solid #ffffff12;background:#1b1727;border-radius:18px;padding:28px}.support-error p{font-size:13px;color:#a7a1b8;line-height:1.7}@media(max-width:760px){.support-layout{grid-template-columns:1fr;padding-top:20px}.support-creator{position:static}.support-methods{grid-template-columns:1fr}.support-amounts{grid-template-columns:repeat(2,minmax(0,1fr))}}
      `}</style>
      <div className="support-wrap">
        <header className="support-nav">
          <Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link>
          <Link href={username ? `/${username}` : "/"} className="btn btn-ghost">Profil kreator ↗</Link>
        </header>
        {loading ? <div className="support-loading">Memuat halaman kreator…</div> : !creator ? (
          <section className="support-error"><div className="support-kicker">HALAMAN TIDAK TERSEDIA</div><h1>Kreator tidak ditemukan</h1><p>Profil ini tidak tersedia atau belum dipublikasikan.</p><Link href="/" className="btn btn-primary">Kembali ke Bagisawer</Link></section>
        ) : (
          <div className="support-layout">
            <aside className="support-creator">
              <div className="support-avatar">{creator.display_name.slice(0, 1).toUpperCase()}</div>
              <div className="support-kicker">DUKUNG KREATOR</div>
              <h1>{creator.display_name}</h1>
              <div className="support-handle">@{creator.username}</div>
              <p className="support-bio">{creator.bio || "Dukung karya kreator ini dan sampaikan pesan positif."}</p>
              <div className="support-note">Halaman ini adalah pratinjau tampilan dukungan. Pembayaran belum aktif dan tidak ada uang yang ditarik.</div>
            </aside>
            <section className="support-form-card">
              <div className="support-kicker">KIRIM DUKUNGAN</div>
              <h2>Dukunganmu berarti.</h2>
              <p className="support-intro">Pilih nominal, tulis pesan jika mau, lalu pilih metode yang ingin kamu gunakan. Metode saat ini belum aktif.</p>
              <form onSubmit={submit}>
                <div className="support-field"><span className="support-label">Pilih nominal</span><div className="support-amounts">{amounts.map((value) => <button key={value} type="button" className={amount === value && !customAmount ? "support-amount active" : "support-amount"} onClick={() => { setAmount(value); setCustomAmount(""); }}>{formatIDR(value)}</button>)}</div></div>
                <div className="support-field"><label htmlFor="custom-amount">Nominal lainnya (Rp)</label><input id="custom-amount" type="number" min="1000" max="100000000" step="1000" value={customAmount} onChange={(event) => setCustomAmount(event.target.value)} placeholder="Contoh: 75000" /></div>
                <div className="support-field"><label htmlFor="support-name">Nama pendukung (opsional)</label><input id="support-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Nama yang ingin ditampilkan" disabled={anonymous} /></div>
                <label className="support-toggle"><input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} /><span>Dukung secara anonim. Nama tidak akan ditampilkan di halaman atau alert ketika integrasi aktif.</span></label>
                <div className="support-field"><label htmlFor="support-message">Pesan untuk kreator (opsional)</label><textarea id="support-message" rows={3} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={240} placeholder="Tulis pesan yang positif dan sopan…" /><small style={{color:"#8f88a2",fontSize:10}}>{message.length}/240 karakter</small></div>
                <div className="support-field"><span className="support-label">Metode pembayaran</span><div className="support-methods">{methods.map((item) => <label key={item.id} className={method === item.id ? "support-method active" : "support-method"}><input type="radio" name="payment-method" value={item.id} checked={method === item.id} onChange={() => setMethod(item.id)} /><span><strong>{item.name}</strong><small>{item.detail}</small><em>Belum tersedia</em></span></label>)}</div></div>
                <button className="support-submit" type="submit">Lanjutkan · {formatIDR(Number.isFinite(selectedAmount) && selectedAmount > 0 ? selectedAmount : amount)} ↗</button>
                {notice && <p className="support-notice" role="status">{notice}</p>}
              </form>
            </section>
          </div>
        )}
        <footer style={{borderTop:"1px solid #ffffff12",padding:"18px 0",fontSize:11,color:"#817a94",lineHeight:1.7}}>Bagisawer · Pratinjau produk. Jangan kirim uang melalui halaman ini sampai metode pembayaran resmi tersedia.</footer>
      </div>
    </main>
  );
}
