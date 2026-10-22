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

function unavailable() {
  return json({ error: "Layanan overlay belum dikonfigurasi. Periksa secret Supabase khusus server." }, 503);
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
  const byFeature = new Map<string, { feature_key: string; revoked_at: string | null; created_at: string | null }>();
  for (const row of data ?? []) byFeature.set(row.feature_key, row);
  return json({
    features: FEATURE_KEYS.map((featureKey) => {
      const row = byFeature.get(featureKey);
      return { featureKey, active: Boolean(row && !row.revoked_at), createdAt: row?.created_at ?? null };
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

  let origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
  try { origin = new URL(request.url).origin; } catch { /* keep configured fallback */ }
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
