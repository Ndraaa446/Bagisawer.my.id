import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sesi masuk diperlukan." }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "Layanan overlay belum dikonfigurasi di server." }, { status: 503 });

  const { data: token, error: tokenError } = await admin
    .from("overlay_tokens")
    .select("user_id")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .maybeSingle();

  if (tokenError) return NextResponse.json({ error: "Status overlay gagal diperiksa." }, { status: 500 });
  if (!token) return NextResponse.json({ error: "Buat URL overlay terlebih dahulu." }, { status: 409 });

  const { data: settings } = await supabase
    .from("creator_stream_settings")
    .select("alert_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  if (settings?.alert_enabled === false) {
    return NextResponse.json({ error: "Aktifkan alert terlebih dahulu di pengaturan." }, { status: 409 });
  }

  const recentCutoff = new Date(Date.now() - 3000).toISOString();
  const { data: recent, error: recentError } = await supabase
    .from("alert_events")
    .select("id")
    .eq("user_id", user.id)
    .gte("created_at", recentCutoff)
    .limit(1);

  if (recentError) return NextResponse.json({ error: "Antrean alert gagal diperiksa." }, { status: 500 });
  if (recent?.length) return NextResponse.json({ error: "Tunggu beberapa detik sebelum mengirim alert uji lagi." }, { status: 429 });

  const { error: insertError } = await supabase.from("alert_events").insert({
    user_id: user.id,
    event_type: "test",
    source: "test",
    donor_name: "Tes Bagisawer",
    message: "Ini hanya alert uji coba — bukan donasi.",
    amount: 25000,
    status: "pending",
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString()
  });

  if (insertError) return NextResponse.json({ error: "Alert uji gagal dibuat." }, { status: 500 });
  return NextResponse.json({ ok: true, message: "Alert uji masuk ke antrean overlay." }, { headers: { "Cache-Control": "no-store" } });
}
