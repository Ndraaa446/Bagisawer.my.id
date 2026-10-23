import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const FEATURE_KEYS = new Set([
  "saweran", "anonim", "pesan", "target", "mediashare", "voicenote", "lagu", "qris",
  "leaderboard", "subathon", "running-text", "soundboard", "polling", "vip-queue",
  "bagpao", "gachaton", "bidcoin"
]);

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return json({ error: "Sesi masuk diperlukan." }, 401);

  const admin = createAdminClient();
  if (!admin) return json({ error: "Layanan overlay belum dikonfigurasi di server." }, 503);

  let body: { featureKey?: unknown };
  try { body = await request.json(); } catch { return json({ error: "JSON permintaan tidak valid." }, 400); }
  if (typeof body.featureKey !== "string" || !FEATURE_KEYS.has(body.featureKey)) {
    return json({ error: "Jenis overlay tidak dikenal." }, 400);
  }

  const { data: featureSettings, error: settingsError } = await admin
    .from("creator_feature_settings")
    .select("enabled, overlay_enabled")
    .eq("user_id", user.id)
    .eq("feature_key", body.featureKey)
    .maybeSingle();
  if (settingsError) return json({ error: "Status aktivasi overlay belum dapat dibaca." }, 503);
  if (featureSettings?.enabled !== true) return json({ error: "Aktifkan fitur ini terlebih dahulu." }, 409);
  if (featureSettings.overlay_enabled !== true) return json({ error: "Aktifkan overlay fitur ini terlebih dahulu." }, 409);

  const { data, error } = await admin.rpc("enqueue_feature_test_alert", {
    p_user_id: user.id,
    p_feature_key: body.featureKey
  });
  if (error || !data || typeof data !== "object") return json({ error: "Alert uji belum dapat dibuat." }, 500);

  const result = data as { ok?: boolean; reason?: string };
  if (result.ok) return json({ ok: true, message: "Alert uji masuk ke antrean overlay fitur ini." });
  if (result.reason === "token_inactive") return json({ error: "Buat URL overlay untuk fitur ini terlebih dahulu." }, 409);
  if (result.reason === "alerts_disabled") return json({ error: "Aktifkan alert di pengaturan livestream terlebih dahulu." }, 409);
  if (result.reason === "rate_limited") return json({ error: "Tunggu beberapa detik sebelum mengirim alert uji lagi untuk fitur ini." }, 429);
  if (result.reason === "invalid_feature") return json({ error: "Jenis overlay tidak dikenal." }, 400);
  return json({ error: "Alert uji ditolak oleh pengaman server." }, 409);
}
