import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("creator_profiles")
    .select("display_name, bio, is_public")
    .eq("username", username.toLowerCase())
    .eq("is_public", true)
    .maybeSingle();

  if (!data) return { title: "Kreator tidak ditemukan — Bagisawer" };
  return {
    title: `${data.display_name} — Bagisawer`,
    description: data.bio || `Kenali ${data.display_name} di Bagisawer.`
  };
}

export default async function PublicCreatorPage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("username, display_name, bio, avatar_url")
    .eq("username", username.toLowerCase())
    .eq("is_public", true)
    .maybeSingle();

  if (!profile) notFound();

  return (
    <main className="wrap public-profile-page">
      <header className="nav">
        <Link href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></Link>
        <Link className="btn btn-ghost" href="/login">Ruang kreator</Link>
      </header>
      <section className="public-profile-card">
        <div className="public-avatar">{profile.display_name.slice(0, 1).toUpperCase()}</div>
        <div className="section-kicker">HALAMAN KREATOR</div>
        <h1 className="public-profile-title">{profile.display_name}</h1>
        <p className="public-profile-username">@{profile.username}</p>
        <p className="public-profile-bio">{profile.bio || "Kreator ini belum menambahkan bio."}</p>
        <div className="public-profile-note">
          <span className="profile-status status-public">Profil publik</span>
          <p>Halaman dukungan dan pembayaran belum aktif. Jangan kirim uang melalui tautan atau metode yang belum diverifikasi oleh Bagisawer.</p>
        </div>
        <Link href="/features" className="btn btn-ghost">Pelajari Bagisawer <span aria-hidden="true">↗</span></Link>
      </section>
      <footer className="dashboard-footer">Bagisawer · Dibuat untuk kreator dan komunitas Indonesia</footer>
    </main>
  );
}
