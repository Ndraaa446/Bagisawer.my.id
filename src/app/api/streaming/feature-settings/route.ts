import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const FEATURE_KEYS = [
  "saweran", "anonim", "pesan", "target", "mediashare", "voicenote", "lagu", "qris",
  "leaderboard", "subathon", "running-text", "soundboard", "polling", "vip-queue",
  "bagpao", "gachaton", "bidcoin"
] as const;
type FeatureKey = typeof FEATURE_KEYS[number];
function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}
function normalizeMinimumAmount(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1000 && value <= 100000000 && value % 1000 === 0 ? value : 1000;
}
function isFeatureKey(value: unknown): value is FeatureKey {
  return typeof value === "string" && FEATURE_KEYS.includes(value as FeatureKey);
}
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return json({ error: "Sesi masuk diperlukan." }, 401);
  const admin = createAdminClient();
  if (!admin) return json({ error: "Pengaturan fitur belum dikonfigurasi di server." }, 503);
  const { data, error: readError } = await admin.from("creator_feature_settings")
    .select("feature_key, enabled, minimum_amount, overlay_enabled, configuration").eq("user_id", user.id);
  if (readError) return json({ error: "Pengaturan aktivasi fitur gagal dimuat." }, 503);
  const enabled = new Set((data ?? []).filter((row) => row.enabled).map((row) => row.feature_key));
  enabled.add("saweran");
  return json({ features: FEATURE_KEYS.map((featureKey) => { const row = (data ?? []).find((item) => item.feature_key === featureKey); return { featureKey, enabled: enabled.has(featureKey), minimumAmount: normalizeMinimumAmount(row?.minimum_amount), overlayEnabled: enabled.has(featureKey) && Boolean(row?.overlay_enabled), configuration: row?.configuration ?? {} }; }) });
}
export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return json({ error: "Sesi masuk diperlukan." }, 401);
  const admin = createAdminClient();
  if (!admin) return json({ error: "Pengaturan fitur belum dikonfigurasi di server." }, 503);
  let body: { featureKey?: unknown; enabled?: unknown; minimumAmount?: unknown; overlayEnabled?: unknown; configuration?: unknown };
  try { body = await request.json(); } catch { return json({ error: "JSON permintaan tidak valid." }, 400); }
  if (!isFeatureKey(body.featureKey) || typeof body.enabled !== "boolean" || (body.overlayEnabled !== undefined && typeof body.overlayEnabled !== "boolean") || (body.minimumAmount !== undefined && (!Number.isSafeInteger(body.minimumAmount) || Number(body.minimumAmount) < 1000 || Number(body.minimumAmount) > 100000000 || Number(body.minimumAmount) % 1000 !== 0))) {
    return json({ error: "Jenis fitur atau status aktivasi tidak valid." }, 400);
  }
  if (body.configuration !== undefined && (!body.configuration || typeof body.configuration !== "object" || Array.isArray(body.configuration) || Object.keys(body.configuration as Record<string, unknown>).length > 100 || JSON.stringify(body.configuration).length > 20000)) return json({ error: "Konfigurasi fitur tidak valid atau terlalu besar." }, 400);
  if (body.featureKey === "saweran" && !body.enabled) {
    return json({ error: "Fitur saweran utama tidak dapat dinonaktifkan dari menu ini." }, 400);
  }
  const { data: existing, error: existingError } = await admin.from("creator_feature_settings").select("enabled, minimum_amount, overlay_enabled, configuration").eq("user_id", user.id).eq("feature_key", body.featureKey).maybeSingle();
  if (existingError) return json({ error: "Pengaturan fitur sebelumnya gagal dibaca." }, 503);
  const nextMinimumAmount = body.minimumAmount === undefined ? normalizeMinimumAmount(existing?.minimum_amount) : body.minimumAmount;
  const nextOverlayEnabled = body.enabled && (body.overlayEnabled ?? Boolean(existing?.overlay_enabled));
  const { error: writeError } = await admin.from("creator_feature_settings").upsert({
    user_id: user.id, feature_key: body.featureKey, enabled: body.enabled, minimum_amount: nextMinimumAmount, overlay_enabled: nextOverlayEnabled, configuration: body.configuration === undefined ? (existing?.configuration ?? {}) : body.configuration, updated_at: new Date().toISOString()
  }, { onConflict: "user_id,feature_key" });
  if (writeError) return json({ error: "Status aktivasi fitur gagal disimpan." }, 500);
  return json({ ok: true, featureKey: body.featureKey, enabled: body.enabled, minimumAmount: nextMinimumAmount, overlayEnabled: nextOverlayEnabled });
}
