"use client";

import Link from "next/link";
import { useState } from "react";

type Donation = { reference: string; amount_idr: number; currency: string; status: string; created_at: string };

export function SandboxPayments() {
  const [amount, setAmount] = useState("25000");
  const [donorName, setDonorName] = useState("Pendukung Uji");
  const [message, setMessage] = useState("Semangat terus berkarya!");
  const [donation, setDonation] = useState<Donation | null>(null);
  const [busy, setBusy] = useState<"create" | "simulate" | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function createDonation() {
    setBusy("create");
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/payments/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ action: "create", amount: Number(amount), donorName, message })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Transaksi sandbox gagal dibuat.");
      setDonation(data.donation as Donation);
      setNotice(data.note ?? "Transaksi sandbox dibuat.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setBusy(null);
    }
  }

  async function simulateSuccess() {
    if (!donation) return;
    setBusy("simulate");
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/payments/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ action: "simulate_success", reference: donation.reference })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Simulasi pembayaran gagal.");
      setDonation({ ...donation, status: data.result?.duplicate ? (data.result?.donation_status ?? "succeeded") : "succeeded" });
      setNotice(data.result?.duplicate ? "Event duplikat dikenali dengan aman; ledger tidak ditambah." : "Pembayaran sandbox disimulasikan. Ledger berpasangan dan alert uji masuk ke antrean.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulasi pembayaran gagal.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="wrap dashboard-page">
      <header className="nav dashboard-nav">
        <Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link>
        <div className="dashboard-user"><Link className="btn btn-ghost" href="/dashboard">Dashboard</Link><Link className="btn btn-ghost" href="/dashboard/streaming">Livestream & OBS</Link></div>
      </header>
      <section className="dashboard-intro">
        <div className="section-kicker">PAYMENT SANDBOX</div>
        <h1 className="dashboard-title">Uji alur pembayaran dengan aman.</h1>
        <p className="dashboard-copy">Simulasi ini tidak menghubungi bank, e-wallet, atau penyedia pembayaran dan tidak memindahkan uang sungguhan.</p>
      </section>
      <div className="streaming-layout sandbox-layout">
        <section className="feature-card dashboard-editor">
          <div className="section-kicker">BUAT TRANSAKSI UJI</div>
          <h2 className="dashboard-section-title">Data simulasi</h2>
          <div className="profile-form">
            <label>Nominal simulasi (IDR)
              <input type="number" min="1000" max="100000000" step="1000" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            <label>Nama pendukung uji
              <input maxLength={80} value={donorName} onChange={(e) => setDonorName(e.target.value)} />
            </label>
            <label>Pesan
              <textarea maxLength={240} rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
            <button className="btn btn-primary" type="button" disabled={busy !== null} onClick={createDonation}>{busy === "create" ? "Membuat…" : "Buat transaksi pending"}</button>
          </div>
        </section>
        <aside className="dashboard-side">
          <section className="feature-card">
            <div className="section-kicker">TRANSAKSI UJI TERAKHIR</div>
            {donation ? <>
              <div className="sandbox-status">{donation.status === "succeeded" ? "SIMULASI BERHASIL" : "MENUNGGU SIMULASI"}</div>
              <h2 className="dashboard-section-title">Rp{donation.amount_idr.toLocaleString("id-ID")}</h2>
              <p className="dashboard-muted">Referensi internal</p>
              <code className="sandbox-reference">{donation.reference}</code>
              <p className="dashboard-muted">Status: <strong>{donation.status}</strong> · Mata uang: {donation.currency}</p>
              <button className="btn btn-primary" type="button" disabled={busy !== null || donation.status !== "pending"} onClick={simulateSuccess}>{busy === "simulate" ? "Memproses…" : "Simulasikan pembayaran berhasil"}</button>
              <p className="dashboard-muted">Kirim event sukses yang sama lagi akan ditangani sebagai duplikat, bukan transaksi baru.</p>
            </> : <p className="dashboard-muted">Buat transaksi sandbox terlebih dahulu. Setelah referensi dibuat, kamu bisa mensimulasikan event sukses.</p>}
          </section>
          <section className="feature-card">
            <div className="section-kicker">PENGAMAN</div>
            <ul className="sandbox-checks">
              <li>Semua data ditandai sandbox.</li>
              <li>Referensi transaksi dibuat di server.</li>
              <li>Event yang sama tidak menggandakan ledger.</li>
              <li>Ledger menyimpan dua entri berlawanan agar jumlahnya seimbang.</li>
              <li>Alert yang diantrekan tetap berlabel uji, bukan donasi nyata.</li>
            </ul>
          </section>
        </aside>
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {notice && <p className="auth-message" role="status">{notice}</p>}
      <footer className="dashboard-footer">Bagisawer · Sandbox saja · Pembayaran nyata belum aktif</footer>
    </main>
  );
}
