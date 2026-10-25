import { createHash, randomBytes } from "node:crypto";
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
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0", "Referrer-Policy": "no-referrer" } });
}

async function currentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return error || !user ? null : user;
}

function isFeatureKey(value: unknown): value is FeatureKey {
  return typeof value === "string" && FEATURE_KEYS.includes(value as FeatureKey);
}

function normalizeMinimumAmount(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1000 && value <= 100000000 && value % 1000 === 0 ? value : 1000;
}

function moduleEnabled(featureKey: FeatureKey, configuration: unknown): boolean {
  if (featureKey !== "anonim" && featureKey !== "mediashare" && featureKey !== "voicenote") return true;
  if (!configuration || typeof configuration !== "object" || Array.isArray(configuration)) return true;
  return (configuration as Record<string, unknown>).enabled !== false;
}

function unavailable() {
  return json({ error: "Layanan overlay belum dikonfigurasi. Periksa secret Supabase khusus server." }, 503);
}

function appOrigin(request: Request) {
  // Use the origin that served this request so Netlify deploy previews keep
  // their own overlay URLs instead of accidentally pointing at production.
  // Never construct an overlay URL from a user-supplied request body/header.
  const url = new URL(request.url);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Unsupported request origin");
  }
  return url.origin;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return json({ error: "Sesi masuk diperlukan." }, 401);
  const admin = createAdminClient();
  if (!admin) return unavailable();

  const { data, error } = await admin
    .from("creator_feature_overlay_tokens")
    .select("feature_key, revoked_at, created_at")
    .eq("user_id", user.id);

  if (error) return json({ error: "Status overlay per fitur belum dapat dibaca." }, 503);
  const { data: settings, error: settingsError } = await admin
    .from("creator_feature_settings")
    .select("feature_key, enabled, minimum_amount, overlay_enabled, configuration")
    .eq("user_id", user.id);
  if (settingsError) return json({ error: "Status aktivasi fitur belum dapat dibaca." }, 503);
  const byFeature = new Map<string, { feature_key: string; revoked_at: string | null; created_at: string | null }>();
  for (const row of data ?? []) byFeature.set(row.feature_key, row);
  const settingByFeature = new Map((settings ?? []).map((row) => [row.feature_key, row]));
  return json({
    features: FEATURE_KEYS.map((featureKey) => {
      const row = byFeature.get(featureKey);
      const setting = settingByFeature.get(featureKey);
      return {
        featureKey,
        // A stored, unrevoked token is not usable when its feature/overlay is off.
        // Report effective state rather than merely whether a token row exists.
        active: Boolean(row && !row.revoked_at && setting?.enabled === true && setting?.overlay_enabled === true && moduleEnabled(featureKey, setting.configuration)),
        createdAt: row?.created_at ?? null,
        supportEnabled: featureKey === "saweran" || Boolean(setting?.enabled && moduleEnabled(featureKey, setting.configuration)),
        overlayEnabled: Boolean(setting?.enabled && setting?.overlay_enabled && moduleEnabled(featureKey, setting?.configuration)),
        minimumAmount: normalizeMinimumAmount(setting?.minimum_amount)
      };
    })
  });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return json({ error: "Sesi masuk diperlukan." }, 401);
  const admin = createAdminClient();
  if (!admin) return unavailable();

  let body: { featureKey?: unknown };
  try { body = await request.json(); } catch { return json({ error: "JSON permintaan tidak valid." }, 400); }
  if (!isFeatureKey(body.featureKey)) return json({ error: "Jenis overlay tidak dikenal." }, 400);

  // Do not issue URLs that are guaranteed to fail closed at the overlay endpoint.
  // Re-check ownership-scoped feature settings on the server immediately before token creation.
  const { data: featureSetting, error: settingError } = await admin
    .from("creator_feature_settings")
    .select("enabled, overlay_enabled, configuration")
    .eq("user_id", user.id)
    .eq("feature_key", body.featureKey)
    .maybeSingle();
  if (settingError) return json({ error: "Status fitur belum dapat diperiksa." }, 503);
  if (featureSetting?.enabled !== true) {
    return json({ error: "Aktifkan fitur ini terlebih dahulu sebelum membuat URL overlay." }, 409);
  }
  if (featureSetting.overlay_enabled !== true) {
    return json({ error: "Aktifkan overlay fitur ini terlebih dahulu sebelum membuat URL." }, 409);
  }
  if (!moduleEnabled(body.featureKey, featureSetting.configuration)) {
    return json({ error: "Aktifkan modul fitur ini di pengaturannya sebelum membuat URL overlay." }, 409);
  }

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { error } = await admin.from("creator_feature_overlay_tokens").upsert({
    user_id: user.id,
    feature_key: body.featureKey,
    token_hash: tokenHash,
    created_at: new Date().toISOString(),
    revoked_at: null,
    last_used_at: null
  }, { onConflict: "user_id,feature_key" });

  if (error) return json({ error: "Token khusus fitur gagal dibuat. Coba lagi." }, 500);

  const origin = appOrigin(request);
  return json({
    ok: true,
    featureKey: body.featureKey,
    url: `${origin}/overlay/${token}`,
    warning: "URL ini adalah rahasia. Token lama untuk fitur ini langsung tidak berlaku; salin dan simpan URL baru sekarang."
  });
}

export async function DELETE(request: Request) {
  const user = await currentUser();
  if (!user) return json({ error: "Sesi masuk diperlukan." }, 401);
  const admin = createAdminClient();
  if (!admin) return unavailable();

  let body: { featureKey?: unknown };
  try { body = await request.json(); } catch { return json({ error: "JSON permintaan tidak valid." }, 400); }
  if (!isFeatureKey(body.featureKey)) return json({ error: "Jenis overlay tidak dikenal." }, 400);

  const { data, error } = await admin.from("creator_feature_overlay_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("feature_key", body.featureKey)
    .is("revoked_at", null)
    .select("id");

  if (error) return json({ error: "Token overlay gagal dicabut." }, 500);
  return json({ ok: true, active: false, revoked: Boolean(data?.length) });
}
