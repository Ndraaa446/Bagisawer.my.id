import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreatorDashboard } from "@/components/creator-dashboard";

export const metadata = { title: "Dashboard Kreator — Bagisawer" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("creator_profiles")
    .select("user_id, username, display_name, bio, avatar_url, is_public")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return (
      <main className="wrap dashboard-page">
        <header className="nav"><a href="/" className="brand"><span className="brand-mark">b</span><span>bagi<span className="gradient-text">sawer</span></span></a></header>
        <section className="feature-card dashboard-editor">
          <h1 className="dashboard-title">Profil belum siap</h1>
          <p className="dashboard-muted">Kami belum dapat memuat profil kreatormu. Muat ulang halaman beberapa saat lagi atau hubungi dukungan jika masalah berlanjut.</p>
          <a href="/dashboard" className="btn btn-primary">Coba lagi</a>
        </section>
      </main>
    );
  }

  return <CreatorDashboard initialProfile={profile} email={user.email ?? ""} />;
}
