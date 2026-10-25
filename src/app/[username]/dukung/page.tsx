"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validateSupportAmount, validateSupportText } from "@/lib/support-validation";

type Creator = { username: string; display_name: string; bio: string | null; avatar_url: string | null };
type SupportFeature = { key: string; label: string; description: string; category: "donasi" | "interaksi"; minimumAmount: number };
const methods = [
  { id: "qris", name: "QRIS", detail: "Satu kode untuk aplikasi pembayaran yang mendukung" },
  { id: "va", name: "Virtual Account", detail: "VA bank sesuai dukungan provider" },
  { id: "bank", name: "Transfer bank", detail: "Instruksi transfer dan konfirmasi terverifikasi" },
  { id: "online-banking", name: "Mobile/online banking", detail: "Kanal bank yang didukung provider" },
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
  const [method, setMethod] = useState("qris");
  const [features, setFeatures] = useState<SupportFeature[]>([{ key: "saweran", label: "Saweran", description: "Dukungan nominal langsung", category: "donasi", minimumAmount: 1000 }]);
  const [selectedFeature, setSelectedFeature] = useState("saweran");
  const selectedFeatureConfig = features.find((feature) => feature.key === selectedFeature) ?? features[0];
  const minimumAmount = selectedFeatureConfig?.minimumAmount ?? 1000;
  const [featureLoadError, setFeatureLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [preflightLoading, setPreflightLoading] = useState(false);

  useEffect(() => {
    const currentFeature = features.find((feature) => feature.key === selectedFeature);
    if (!currentFeature) return;
    const minimum = currentFeature.minimumAmount;
    if (customAmount.trim()) {
      const customValue = Number(customAmount);
      if (Number.isFinite(customValue) && customValue > 0 && customValue < minimum) {
        setCustomAmount(String(minimum));
      }
      return;
    }
    if (amount < minimum) {
      const nextPreset = amounts.find((value) => value >= minimum);
      if (nextPreset !== undefined) setAmount(nextPreset);
      else setCustomAmount(String(minimum));
    }
  }, [features, selectedFeature, amount, customAmount]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const optionsResponse = await fetch(`/api/creators/${encodeURIComponent(username)}/support-options`, { cache: "no-store" });
        const optionsData = await optionsResponse.json();
        if (!optionsResponse.ok) throw new Error(optionsData.error ?? "Jenis dukungan gagal dimuat.");
        if (!cancelled && Array.isArray(optionsData.features) && optionsData.features.length) {
          setFeatures(optionsData.features as SupportFeature[]);
          setSelectedFeature((current) => optionsData.features.some((feature: SupportFeature) => feature.key === current) ? current : optionsData.features[0].key);
        }
        const supabase = createClient();
        const { data } = await supabase.from("creator_profiles")
          .select("username, display_name, bio, avatar_url")
          .eq("username", username)
          .eq("is_public", true)
          .maybeSingle();
        if (!cancelled && data) setCreator(data as Creator);
      } catch (error) {
        if (!cancelled) {
          setFeatureLoadError(error instanceof Error ? error.message : "Jenis dukungan gagal dimuat.");
          try {
            const supabase = createClient();
            const { data } = await supabase.from("creator_profiles").select("username, display_name, bio, avatar_url").eq("username", username).eq("is_public", true).maybeSingle();
            if (data) setCreator(data as Creator);
          } catch { setCreator(null); }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (username) void load();
    return () => { cancelled = true; };
  }, [username]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = customAmount.trim() ? Number(customAmount) : amount;
    if (!validateSupportAmount(value, minimumAmount)) {
      setNotice(`Nominal untuk ${selectedFeatureConfig?.label ?? "fitur ini"} harus minimal ${formatIDR(minimumAmount)}, maksimal Rp100.000.000, dan kelipatan Rp1.000.`);
      return;
    }
    if (!validateSupportText(name, message)) {
      setNotice("Nama maksimal 80 karakter dan pesan maksimal 240 karakter.");
      return;
    }
    setPreflightLoading(true);
    setNotice("");
    try {
      const response = await fetch(`/api/creators/${encodeURIComponent(username)}/support-preflight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          featureKey: selectedFeature,
          amount: value,
          donorName: name,
          message,
          paymentMethod: method,
          anonymous: selectedFeature === "anonim"
        })
      });
      const data = await response.json();
      if (response.status === 409 && data.code === "checkout_disabled") {
        const chosenMethod = methods.find((item) => item.id === method)?.name ?? "metode pilihan";
        const chosenFeature = features.find((item) => item.key === selectedFeature)?.label ?? "Saweran";
        setNotice(`Data tervalidasi: ${chosenFeature} · ${formatIDR(value)} melalui ${chosenMethod}. Checkout belum aktif karena provider pembayaran belum dikonfigurasi. Tidak ada transaksi atau penarikan uang yang dibuat.`);
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "Dukungan belum dapat divalidasi.");
      setNotice("Data dukungan berhasil divalidasi.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Dukungan belum dapat divalidasi. Coba lagi.");
    } finally {
      setPreflightLoading(false);
    }
  }

  const selectedAmount = customAmount.trim() ? Number(customAmount) : amount;
  const formatIDR = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

  return (
    <main className="support-page">
      <style>{`
        .support-page{min-height:100vh;padding:0 0 50px;background:radial-gradient(ellipse at 50% -10%,#2c1c4b 0,transparent 45%),var(--bg)}.support-wrap{width:min(1050px,calc(100% - 36px));margin:0 auto}.support-nav{height:76px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff12}.support-layout{display:grid;grid-template-columns:.82fr 1.18fr;gap:20px;padding:38px 0}.support-creator,.support-form-card{border:1px solid #ffffff12;background:linear-gradient(145deg,#1b1727,#13111b);border-radius:18px;padding:24px;height:max-content}.support-creator{text-align:center;position:sticky;top:20px}.support-avatar{width:78px;height:78px;border-radius:24px;display:grid;place-items:center;overflow:hidden;background:linear-gradient(145deg,#c4b5fd,#7c3aed);font-size:30px;font-weight:800;margin:0 auto 15px}.support-avatar img{width:100%;height:100%;object-fit:cover}.support-kicker{font-size:10px;letter-spacing:1.7px;font-weight:800;color:#c4b5fd;text-transform:uppercase}.support-creator h1{font-size:27px;letter-spacing:-1px;line-height:1.2;margin:10px 0}.support-handle{font-size:12px;color:#a7a1b8}.support-bio{font-size:13px;color:#a7a1b8;line-height:1.8;margin:16px 0}.support-note{border-top:1px solid #ffffff12;padding-top:15px;color:#8f88a2;font-size:11px;line-height:1.7;text-align:left}.support-form-card h2{font-size:24px;letter-spacing:-.7px;margin:7px 0}.support-intro{font-size:12px;color:#a7a1b8;line-height:1.7;margin-bottom:22px}.support-field{display:grid;gap:7px;margin:17px 0}.support-field label,.support-label{font-size:12px;font-weight:700;color:#e7e2f1}.support-field input,.support-field textarea{width:100%;border:1px solid #383146;background:#0f0d15;color:#f8f7fc;border-radius:10px;padding:12px;font:inherit;font-size:13px;outline:none}.support-field input:focus,.support-field textarea:focus{border-color:#a78bfa}.support-amounts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.support-amount{border:1px solid #383146;border-radius:10px;background:#ffffff04;color:#e7e2f1;padding:12px 5px;font-size:12px}.support-amount.active{border-color:#a78bfa;background:#a78bfa20;color:#e9d5ff}.support-methods{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.support-feature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.support-feature{display:flex;gap:9px;align-items:flex-start;text-align:left;padding:12px;border:1px solid #383146;border-radius:11px;background:#ffffff03;color:#f8f7fc;min-width:0}.support-feature.active{border-color:#a78bfa;background:#a78bfa12}.support-feature input{accent-color:#a78bfa;margin-top:3px}.support-feature strong{display:block;font-size:12px}.support-feature small{display:block;color:#a7a1b8;font-size:10px;line-height:1.5;margin-top:4px}.support-method{display:flex;align-items:flex-start;gap:10px;text-align:left;padding:12px;border:1px solid #383146;border-radius:11px;background:#ffffff03;color:#f8f7fc;min-width:0}.support-method.active{border-color:#a78bfa;background:#a78bfa12}.support-method input{accent-color:#a78bfa;margin-top:3px}.support-method strong{font-size:12px;display:block}.support-method small{display:block;color:#a7a1b8;font-size:10px;line-height:1.5;margin-top:4px}.support-method em{font-style:normal;font-size:9px;color:#fde68a;display:block;margin-top:5px}.support-toggle{display:flex;gap:10px;align-items:flex-start;font-size:12px;line-height:1.6;color:#c8c2d5}.support-toggle input{accent-color:#a78bfa;margin-top:3px}.support-submit{width:100%;padding:14px;border:0;border-radius:11px;background:linear-gradient(100deg,#a78bfa,#7c3aed);color:white;font-weight:800;margin-top:8px}.support-notice{padding:13px;border:1px solid #fbbf2440;border-radius:11px;background:#fbbf240b;color:#fde68a;font-size:11px;line-height:1.7;margin:14px 0 0}.support-loading{max-width:500px;margin:90px auto;text-align:center;color:#a7a1b8;line-height:1.8}.support-error{max-width:500px;margin:90px auto;text-align:center;border:1px solid #ffffff12;background:#1b1727;border-radius:18px;padding:28px}.support-error p{font-size:13px;color:#a7a1b8;line-height:1.7}@media(max-width:760px){.support-layout{grid-template-columns:1fr;padding-top:20px}.support-creator{position:static}.support-methods,.support-feature-grid{grid-template-columns:1fr}.support-amounts{grid-template-columns:repeat(2,minmax(0,1fr))}}

        /* Donation page redesign: single, focused checkout column instead of a split dashboard layout. */
        .support-page{background:#f6f3ee!important;color:#29251f!important;padding-bottom:34px}
        .support-wrap{width:min(100% - 32px,760px)!important}
        .support-nav{height:68px;border-bottom:1px solid #e6ded4!important}
        .support-nav .brand{font-size:20px}
        .support-nav .btn{background:#fff;border-color:#e5dace;color:#66513f;box-shadow:none}
        .support-layout{display:flex!important;flex-direction:column;gap:14px!important;padding:22px 0 28px!important;max-width:680px;margin:0 auto}
        .support-creator{position:static!important;top:auto!important;text-align:center!important;padding:22px 24px!important;border:1px solid #e8dfd4!important;border-radius:16px!important;background:#fff!important;box-shadow:0 4px 18px #4a32140a!important}
        .support-avatar{width:68px!important;height:68px!important;border-radius:50%!important;margin:0 auto 12px!important;background:#e9d9c8!important;color:#765033!important;font-size:26px!important}
        .support-kicker{font-size:10px!important;letter-spacing:1.2px!important;color:#8c5d40!important}
        .support-creator h1{font-size:24px!important;letter-spacing:-.5px!important;margin:7px 0 4px!important;color:#29251f!important}
        .support-handle{font-size:12px!important;color:#85796e!important}
        .support-bio{font-size:13px!important;line-height:1.65!important;color:#6f665c!important;max-width:480px;margin:10px auto 0!important}
        .support-note{display:none!important}
        .support-form-card{padding:24px!important;border:1px solid #e8dfd4!important;border-radius:16px!important;background:#fff!important;box-shadow:0 4px 18px #4a32140a!important}
        .support-form-card h2{font-size:25px!important;letter-spacing:-.7px!important;color:#29251f!important;margin:6px 0 7px!important}
        .support-intro{font-size:13px!important;line-height:1.65!important;color:#7b7167!important;margin-bottom:20px!important}
        .support-field{gap:9px!important;margin:18px 0!important}
        .support-field label,.support-label{font-size:13px!important;font-weight:700!important;color:#3d342c!important}
        .support-field input,.support-field textarea{background:#fff!important;border:1px solid #ded5ca!important;border-radius:10px!important;color:#29251f!important;padding:13px 14px!important;font-size:14px!important}
        .support-field input:focus,.support-field textarea:focus{border-color:#a87954!important;box-shadow:0 0 0 3px #a8795417!important}
        .support-amounts{grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:9px!important}
        .support-amount{padding:12px 6px!important;background:#fff!important;border:1px solid #ded5ca!important;border-radius:10px!important;color:#51453a!important;font-size:13px!important;font-weight:700!important}
        .support-amount.active{background:#f5ebe1!important;border-color:#9c6c48!important;color:#70472b!important}
        .support-feature-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}
        .support-feature,.support-method{padding:12px!important;border:1px solid #e3dbd1!important;border-radius:10px!important;background:#fff!important;color:#332b24!important}
        .support-feature.active,.support-method.active{background:#f7eee6!important;border-color:#b78b69!important}
        .support-feature strong,.support-method strong{font-size:12px!important;color:#332b24!important}
        .support-feature small,.support-method small{color:#7c7166!important;font-size:11px!important;line-height:1.45!important}
        .support-methods{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}
        .support-method em{color:#986c3f!important;font-size:10px!important}
        .support-toggle{font-size:12px!important;color:#5f554b!important}
        .support-submit{margin-top:10px!important;padding:15px!important;border-radius:10px!important;background:#8c5d40!important;color:#fff!important;font-size:14px!important;font-weight:800!important;box-shadow:none!important}
        .support-notice{background:#fff8e8!important;border-color:#ead6a9!important;color:#72531f!important}
        .support-page footer{max-width:680px;margin:0 auto;color:#8b8075!important;border-color:#e6ded4!important}
        .support-error{background:#fff!important;border-color:#e8dfd4!important;color:#29251f!important}
        @media(max-width:600px){
          .support-wrap{width:calc(100% - 24px)!important}
          .support-nav{height:62px!important}
          .support-layout{padding:14px 0 22px!important;gap:10px!important}
          .support-creator{padding:18px 16px!important}
          .support-form-card{padding:18px 15px!important}
          .support-form-card h2{font-size:23px!important}
          .support-amounts{grid-template-columns:repeat(2,minmax(0,1fr))!important}
          .support-feature-grid,.support-methods{grid-template-columns:1fr!important}
        }

        /* Final alignment pass: keep /dukung on the same ivory / ink / acid / orange system as the redesigned site. */
        .support-page{background:var(--paper,#f4f2ec)!important;color:var(--ink,#171914)!important}
        .support-nav{border-bottom-color:var(--line,#d9d6cc)!important}
        .support-nav .brand,.support-nav .brand-mark{color:var(--ink,#171914)!important}
        .support-nav .brand-mark{background:var(--acid,#d7ff55)!important;border:1px solid var(--ink,#171914)!important;border-radius:50%!important}
        .support-nav .gradient-text{color:var(--ink,#171914)!important}
        .support-nav .btn{background:transparent!important;border-color:var(--ink,#171914)!important;color:var(--ink,#171914)!important;border-radius:4px!important}
        .support-nav .btn:hover{background:var(--acid,#d7ff55)!important}
        .support-creator,.support-form-card,.support-error{background:var(--panel,#fffefa)!important;border-color:var(--line,#d9d6cc)!important;border-radius:5px!important;box-shadow:0 12px 34px rgba(25,27,19,.045)!important}
        .support-avatar{background:var(--acid,#d7ff55)!important;color:var(--ink,#171914)!important;border:1px solid var(--ink,#171914)!important;border-radius:5px!important}
        .support-kicker{color:#686b61!important;letter-spacing:1.5px!important}
        .support-creator h1,.support-form-card h2,.support-error h1{color:var(--ink,#171914)!important}
        .support-handle,.support-bio,.support-intro,.support-loading,.support-error p{color:var(--muted,#686b61)!important}
        .support-field label,.support-label{color:var(--ink,#171914)!important}
        .support-field input,.support-field textarea{background:#fffefa!important;border-color:var(--line,#d9d6cc)!important;color:var(--ink,#171914)!important;border-radius:4px!important}
        .support-field input:focus,.support-field textarea:focus{border-color:var(--ink,#171914)!important;box-shadow:0 0 0 2px rgba(215,255,85,.55)!important}
        .support-amount,.support-feature,.support-method{background:#fffefa!important;border-color:var(--line,#d9d6cc)!important;color:var(--ink,#171914)!important;border-radius:4px!important}
        .support-amount.active,.support-feature.active,.support-method.active{background:var(--acid,#d7ff55)!important;border-color:var(--ink,#171914)!important;color:var(--ink,#171914)!important}
        .support-feature small,.support-method small{color:var(--muted,#686b61)!important}
        .support-method em{color:#9a3c20!important}
        .support-toggle{color:var(--muted,#686b61)!important}
        .support-toggle input,.support-feature input,.support-method input{accent-color:var(--ink,#171914)!important}
        .support-submit{background:var(--ink,#171914)!important;color:#fffefa!important;border:1px solid var(--ink,#171914)!important;border-radius:4px!important;transition:background .2s,color .2s,border-color .2s!important}
        .support-submit:hover:not(:disabled){background:var(--orange,#ff6538)!important;border-color:var(--orange,#ff6538)!important}
        .support-submit:disabled{opacity:.65;cursor:wait}
        .support-notice{background:#fff7d6!important;border-color:#e7d991!important;color:#57461d!important;border-radius:4px!important}
        .support-page footer{border-top-color:var(--line,#d9d6cc)!important;color:var(--muted,#686b61)!important}
        @media(max-width:760px){.support-wrap{width:calc(100% - 24px)!important}.support-layout{padding-top:16px!important}.support-creator,.support-form-card{padding:20px!important}}


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
              <div className="support-avatar">{creator.avatar_url ? <img src={creator.avatar_url} alt={`Avatar ${creator.display_name}`} referrerPolicy="no-referrer" /> : creator.display_name.slice(0, 1).toUpperCase()}</div>
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
                <div className="support-field"><span className="support-label">Pilih nominal</span><small style={{color:"#a7a1b8"}}>Minimal untuk {selectedFeatureConfig?.label ?? "fitur ini"}: {formatIDR(minimumAmount)}</small><div className="support-amounts">{amounts.map((value) => <button key={value} type="button" disabled={value < minimumAmount} title={value < minimumAmount ? `Di bawah minimum ${formatIDR(minimumAmount)}` : undefined} className={amount === value && !customAmount ? "support-amount active" : "support-amount"} style={value < minimumAmount ? {opacity:.35,cursor:"not-allowed"} : undefined} onClick={() => { if (value >= minimumAmount) { setAmount(value); setCustomAmount(""); } }}>{formatIDR(value)}</button>)}</div></div>
                <div className="support-field"><span className="support-label">Pilih jenis dukungan</span><p style={{fontSize:11,color:"#a7a1b8",lineHeight:1.6,margin:0}}>Pilihan berikut mengikuti fitur yang diaktifkan kreator. Fitur yang belum diaktifkan tidak ditampilkan.</p>{featureLoadError && <small role="status" style={{color:"#fde68a"}}>Status fitur belum dapat dimuat dari server: {featureLoadError}</small>}<div className="support-feature-grid">{features.map((feature) => <label key={feature.key} className={selectedFeature === feature.key ? "support-feature active" : "support-feature"}><input type="radio" name="support-feature" value={feature.key} checked={selectedFeature === feature.key} onChange={() => { setSelectedFeature(feature.key); if (feature.key === "anonim") setName(""); if (customAmount.trim() && Number(customAmount) < feature.minimumAmount) setCustomAmount(String(feature.minimumAmount)); else if (!customAmount.trim() && amount < feature.minimumAmount) { const nextAmount = amounts.find((value) => value >= feature.minimumAmount); if (nextAmount !== undefined) setAmount(nextAmount); else setCustomAmount(String(feature.minimumAmount)); } }} /><span><strong>{feature.label}</strong><small>{feature.description}</small></span></label>)}</div></div>
                <div className="support-field"><label htmlFor="custom-amount">Nominal lainnya (Rp)</label><input id="custom-amount" type="number" min={minimumAmount} max="100000000" step="1000" value={customAmount} onChange={(event) => setCustomAmount(event.target.value)} placeholder="Contoh: 75000" /></div>
                <div className="support-field"><label htmlFor="support-name">Nama pendukung (opsional)</label><input id="support-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="Nama yang ingin ditampilkan" disabled={selectedFeature === "anonim"} /></div>
                {features.some((feature) => feature.key === "anonim") && <label className="support-toggle"><input type="checkbox" checked={selectedFeature === "anonim"} onChange={(event) => { const anonymousEnabled = event.target.checked; setSelectedFeature(anonymousEnabled ? "anonim" : "saweran"); if (anonymousEnabled) setName(""); const nextFeature = features.find((feature) => feature.key === (anonymousEnabled ? "anonim" : "saweran")); if (nextFeature && customAmount.trim() && Number(customAmount) < nextFeature.minimumAmount) setCustomAmount(String(nextFeature.minimumAmount)); else if (nextFeature && !customAmount.trim() && amount < nextFeature.minimumAmount) { const nextAmount = amounts.find((value) => value >= nextFeature.minimumAmount); if (nextAmount !== undefined) setAmount(nextAmount); else setCustomAmount(String(nextFeature.minimumAmount)); } }} /><span>Dukung secara anonim. Ini memilih jenis dukungan anonim, dan nama pendukung tidak akan ditampilkan ketika integrasi aktif.</span></label>}
                {features.some((feature) => feature.key === "pesan") && <div className="support-field"><label htmlFor="support-message">Pesan untuk kreator (opsional)</label><textarea id="support-message" rows={3} value={message} onChange={(event) => setMessage(event.target.value)} maxLength={240} placeholder="Tulis pesan yang positif dan sopan…" /><small style={{color:"#8f88a2",fontSize:10}}>{message.length}/240 karakter</small></div>}
                <div className="support-field"><span className="support-label">Metode pembayaran</span><div className="support-methods">{methods.map((item) => <label key={item.id} className={method === item.id ? "support-method active" : "support-method"}><input type="radio" name="payment-method" value={item.id} checked={method === item.id} onChange={() => setMethod(item.id)} /><span><strong>{item.name}</strong><small>{item.detail}</small><em>Belum tersedia</em></span></label>)}</div></div>
                <button className="support-submit" type="submit" disabled={preflightLoading}>{preflightLoading ? "Memeriksa dukungan…" : `Validasi dukungan · ${formatIDR(Number.isFinite(selectedAmount) && selectedAmount > 0 ? selectedAmount : amount)}`}</button>
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
