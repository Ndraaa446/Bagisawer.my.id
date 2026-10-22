"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Field = {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "toggle";
  placeholder?: string;
  help?: string;
  min?: number;
  max?: number;
  options?: string[];
  initial?: string | number | boolean;
};

const fieldsByFeature: Record<string, Field[]> = {
  saweran: [
    {key:"enabled",label:"Aktifkan dukungan",type:"toggle",initial:true},
    {key:"minimum",label:"Nominal minimum (Rp)",type:"number",min:1000,max:100000000,initial:1000},
    {key:"suggested",label:"Nominal rekomendasi",type:"text",initial:"10000, 25000, 50000"},
    {key:"anonymous",label:"Izinkan dukungan anonim",type:"toggle",initial:true},
    {key:"messageLimit",label:"Batas pesan (karakter)",type:"number",min:0,max:500,initial:240}
  ],
  anonim: [
    {key:"enabled",label:"Izinkan mode anonim",type:"toggle",initial:true},
    {key:"display",label:"Tampilan di overlay",type:"select",options:["Pendukung anonim","Sembunyikan nama sepenuhnya"],initial:"Pendukung anonim"},
    {key:"ranking",label:"Tampilkan di leaderboard",type:"toggle",initial:false}
  ],
  pesan: [
    {key:"limit",label:"Batas karakter pesan",type:"number",min:0,max:500,initial:240},
    {key:"moderation",label:"Tahan pesan untuk moderasi",type:"toggle",initial:true},
    {key:"blocked",label:"Kata/frasa yang diblokir",type:"textarea",placeholder:"Satu kata atau frasa per baris",help:"Filter server-side akan dibutuhkan sebelum pesan ditampilkan."}
  ],
  target: [
    {key:"name",label:"Nama target",type:"text",placeholder:"Contoh: Upgrade perangkat"},
    {key:"amount",label:"Target nominal (Rp)",type:"number",min:1000,max:1000000000,initial:1000000},
    {key:"deadline",label:"Tanggal target",type:"text",placeholder:"YYYY-MM-DD"},
    {key:"style",label:"Gaya progres",type:"select",options:["Progress bar","Lingkaran","Minimal"],initial:"Progress bar"}
  ],
  mediashare: [
    {key:"enabled",label:"Aktifkan pengajuan media",type:"toggle",initial:false},
    {key:"duration",label:"Durasi maksimum (detik)",type:"number",min:5,max:600,initial:120},
    {key:"domains",label:"Domain media yang diizinkan",type:"textarea",placeholder:"Satu domain per baris"},
    {key:"review",label:"Wajib moderasi sebelum diputar",type:"toggle",initial:true}
  ],
  voicenote: [
    {key:"enabled",label:"Aktifkan voice note",type:"toggle",initial:false},
    {key:"duration",label:"Durasi maksimum (detik)",type:"number",min:3,max:180,initial:30},
    {key:"size",label:"Ukuran file maksimum (MB)",type:"number",min:1,max:25,initial:5},
    {key:"approval",label:"Wajib persetujuan kreator",type:"toggle",initial:true}
  ],
  lagu: [
    {key:"provider",label:"Integrasi lagu",type:"select",options:["Belum dipilih","Provider resmi (konfigurasi nanti)"],initial:"Belum dipilih"},
    {key:"limit",label:"Batas antrean",type:"number",min:1,max:100,initial:20},
    {key:"blocked",label:"Kata/permintaan yang diblokir",type:"textarea",placeholder:"Satu aturan per baris"}
  ],
  qris: [
    {key:"target",label:"Tujuan QR",type:"select",options:["URL halaman dukungan Bagisawer"],initial:"URL halaman dukungan Bagisawer"},
    {key:"caption",label:"Teks ajakan",type:"text",initial:"Dukung karya kreator"},
    {key:"showUsername",label:"Tampilkan username pada kartu QR",type:"toggle",initial:true}
  ],
  leaderboard: [
    {key:"period",label:"Periode peringkat",type:"select",options:["Harian","Mingguan","Bulanan","Sepanjang waktu"],initial:"Mingguan"},
    {key:"limit",label:"Jumlah peringkat ditampilkan",type:"number",min:3,max:100,initial:10},
    {key:"hideAnonymous",label:"Hormati dukungan anonim",type:"toggle",initial:true}
  ],
  subathon: [
    {key:"initial",label:"Durasi awal (menit)",type:"number",min:1,max:1440,initial:60},
    {key:"perAmount",label:"Tambahan waktu per Rp1.000 (detik)",type:"number",min:0,max:3600,initial:10},
    {key:"cap",label:"Batas maksimum timer (menit)",type:"number",min:1,max:10080,initial:720}
  ],
  "running-text": [
    {key:"speed",label:"Kecepatan",type:"select",options:["Lambat","Normal","Cepat"],initial:"Normal"},
    {key:"duration",label:"Durasi tampil (detik)",type:"number",min:3,max:60,initial:12},
    {key:"limit",label:"Batas karakter",type:"number",min:10,max:240,initial:120},
    {key:"moderation",label:"Moderasi sebelum tampil",type:"toggle",initial:true}
  ],
  soundboard: [
    {key:"volume",label:"Volume maksimum (%)",type:"number",min:0,max:100,initial:50},
    {key:"cooldown",label:"Cooldown trigger (detik)",type:"number",min:1,max:600,initial:10},
    {key:"triggers",label:"Daftar suara/trigger",type:"textarea",placeholder:"Satu trigger per baris"}
  ],
  polling: [
    {key:"question",label:"Pertanyaan polling",type:"text",placeholder:"Tulis pertanyaan"},
    {key:"options",label:"Pilihan jawaban",type:"textarea",placeholder:"Satu pilihan per baris"},
    {key:"duration",label:"Durasi polling (menit)",type:"number",min:1,max:1440,initial:5},
    {key:"oneVote",label:"Satu suara per pengguna",type:"toggle",initial:true}
  ],
  "vip-queue": [
    {key:"policy",label:"Aturan prioritas",type:"select",options:["Urutan waktu","Prioritas berbasis aturan transparan"],initial:"Urutan waktu"},
    {key:"limit",label:"Batas item antrean",type:"number",min:1,max:500,initial:50},
    {key:"review",label:"Perlu moderasi",type:"toggle",initial:true}
  ],
  bagpao: [
    {key:"mode",label:"Status spesifikasi",type:"select",options:["Draft","Menunggu definisi produk"],initial:"Draft"},
    {key:"notes",label:"Catatan kebutuhan",type:"textarea",placeholder:"Jelaskan perilaku modul yang diinginkan"}
  ],
  gachaton: [
    {key:"mode",label:"Mode interaksi",type:"select",options:["Animasi tanpa hadiah finansial","Perlu tinjauan hukum/keamanan"],initial:"Animasi tanpa hadiah finansial"},
    {key:"limit",label:"Batas interaksi per pengguna",type:"number",min:1,max:100,initial:5},
    {key:"history",label:"Tampilkan histori hasil",type:"toggle",initial:true}
  ],
  bidcoin: [
    {key:"label",label:"Nama poin internal",type:"text",initial:"Bidcoin"},
    {key:"dailyLimit",label:"Batas poin per hari",type:"number",min:0,max:100000,initial:100},
    {key:"rules",label:"Aturan penggunaan poin",type:"textarea",placeholder:"Poin internal bukan uang/aset finansial."}
  ],
  store: [
    {key:"supplier",label:"Supplier/integrasi",type:"select",options:["Belum dipilih","Menunggu API supplier"],initial:"Belum dipilih"},
    {key:"limit",label:"Batas produk ditampilkan",type:"number",min:1,max:500,initial:24},
    {key:"refund",label:"Periode refund (hari)",type:"number",min:0,max:90,initial:7}
  ],
  notifikasi: [
    {key:"inApp",label:"Notifikasi dalam aplikasi",type:"toggle",initial:true},
    {key:"email",label:"Notifikasi email",type:"toggle",initial:false},
    {key:"events",label:"Kategori notifikasi",type:"textarea",placeholder:"Pembayaran, keamanan, pencairan, produk"}
  ],
  kompetisi: [
    {key:"title",label:"Nama kompetisi",type:"text",placeholder:"Nama event"},
    {key:"period",label:"Periode",type:"text",placeholder:"Tanggal mulai — tanggal akhir"},
    {key:"scoring",label:"Aturan penilaian",type:"textarea",placeholder:"Aturan harus transparan dan dapat diaudit."}
  ]
};

export function FeatureModuleSettings({ featureKey, title }: { featureKey: string; title: string }) {
  const fields = useMemo(() => fieldsByFeature[featureKey] ?? [
    {key:"enabled",label:"Aktifkan modul",type:"toggle" as const,initial:false},
    {key:"notes",label:"Catatan konfigurasi",type:"textarea" as const,placeholder:"Catatan kebutuhan modul"}
  ], [featureKey]);
  const [values, setValues] = useState<Record<string, string | number | boolean>>(() => Object.fromEntries(fields.map((field) => [field.key, field.initial ?? ""])));
  const [notice, setNotice] = useState("");
  const storageKey = "bagisawer:feature-settings:" + featureKey;

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (!stored) return;
      const parsed: unknown = JSON.parse(stored);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) setValues((previous) => ({ ...previous, ...(parsed as Record<string, string | number | boolean>) }));
    } catch { setNotice("Pengaturan lokal tidak dapat dibaca. Nilai awal tetap tersedia."); }
  }, [storageKey]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    for (const field of fields) {
      const value = values[field.key];
      if (field.type === "number") {
        const numericValue = typeof value === "number" ? value : Number(value);
        if (value === "" || !Number.isFinite(numericValue) ||
          (field.min !== undefined && numericValue < field.min) ||
          (field.max !== undefined && numericValue > field.max)) {
          setNotice(`${field.label}: masukkan angka yang valid${field.min !== undefined ? ` (minimum ${field.min})` : ""}${field.max !== undefined ? ` (maksimum ${field.max})` : ""}.`);
          return;
        }
      }
      if ((field.type === "text" || field.type === "textarea") && typeof value === "string" && value.length > 2000) {
        setNotice(`${field.label}: teks terlalu panjang (maksimum 2.000 karakter).`);
        return;
      }
    }
    try { window.localStorage.setItem(storageKey, JSON.stringify(values)); setNotice("Pengaturan tersimpan di browser ini saja; belum tersinkron ke akun/server atau event produksi."); } catch { setNotice("Browser tidak dapat menyimpan pengaturan lokal."); }
  }

  return (
    <form className="tool-card" onSubmit={submit} style={{display:"grid",gap:15}}>
      <div><div className="tool-eyebrow">KONFIGURASI MODUL</div><h2 style={{fontSize:22,margin:"8px 0"}}>{title}</h2><p style={{fontSize:12,color:"var(--muted)",lineHeight:1.7,margin:0}}>Pengaturan disimpan di browser perangkat ini agar tetap ada saat halaman dibuka kembali. Belum tersinkron ke akun/server dan tidak mengubah event produksi.</p></div>
      {fields.map((field) => (
        <label key={field.key} style={{display:"grid",gap:7,fontSize:12,fontWeight:700}}>
          {field.type === "toggle" ? (
            <span style={{display:"flex",alignItems:"center",gap:10}}>
              <input type="checkbox" checked={Boolean(values[field.key])} onChange={(event) => setValues((previous) => ({...previous,[field.key]:event.target.checked}))} />
              {field.label}
            </span>
          ) : <span>{field.label}</span>}
          {field.type === "text" && <input value={String(values[field.key] ?? "")} placeholder={field.placeholder} onChange={(event) => setValues((previous) => ({...previous,[field.key]:event.target.value}))} style={{padding:12,borderRadius:10,border:"1px solid var(--line)",background:"#0f0d15",color:"var(--text)"}} />}
          {field.type === "number" && <input type="number" min={field.min} max={field.max} value={String(values[field.key] ?? "")} onChange={(event) => setValues((previous) => ({...previous,[field.key]:event.target.value === "" ? "" : Number(event.target.value)}))} style={{padding:12,borderRadius:10,border:"1px solid var(--line)",background:"#0f0d15",color:"var(--text)"}} />}
          {field.type === "textarea" && <textarea rows={3} value={String(values[field.key] ?? "")} placeholder={field.placeholder} onChange={(event) => setValues((previous) => ({...previous,[field.key]:event.target.value}))} style={{padding:12,borderRadius:10,border:"1px solid var(--line)",background:"#0f0d15",color:"var(--text)",resize:"vertical"}} />}
          {field.type === "select" && <select value={String(values[field.key] ?? "")} onChange={(event) => setValues((previous) => ({...previous,[field.key]:event.target.value}))} style={{padding:12,borderRadius:10,border:"1px solid var(--line)",background:"#0f0d15",color:"var(--text)"}}>{(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}</select>}
          {field.help && <small style={{fontSize:10,color:"var(--muted)",lineHeight:1.6}}>{field.help}</small>}
        </label>
      ))}
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}><button className="btn btn-primary" type="submit">Simpan pengaturan lokal</button><button className="btn btn-ghost" type="button" onClick={() => { window.localStorage.removeItem(storageKey); setValues(Object.fromEntries(fields.map((field) => [field.key, field.initial ?? ""]))); setNotice("Pengaturan lokal dihapus dan nilai awal dipulihkan."); }}>Pulihkan nilai awal</button></div>
      {notice && <p className="auth-message" role="status">{notice}</p>}
    </form>
  );
}
