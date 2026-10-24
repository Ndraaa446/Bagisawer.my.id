import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateSupportAmount, validateSupportText } from "@/lib/support-validation";

export const dynamic = "force-dynamic";

const FEATURE_KEYS = [
  "saweran", "anonim", "pesan", "target", "mediashare", "voicenote", "lagu", "qris",
  "leaderboard", "subathon", "running-text", "soundboard", "polling", "vip-queue",
  "bagpao", "gachaton", "bidcoin"
] as const;
const PAYMENT_METHODS = new Set([
  "qris", "va", "bank", "online-banking", "gopay", "dana", "ovo",
  "shopeepay", "linkaja", "card", "retail"
]);

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}
function normalizedMinimum(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value) &&
    value >= 1000 && value <= 100000000 && value % 1000 === 0 ? value : 1000;
}

export async function POST(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  let body: {
    featureKey?: unknown;
    amount?: unknown;
    donorName?: unknown;
    message?: unknown;
    paymentMethod?: unknown;
    anonymous?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Data dukungan tidak valid." }, 400);
  }

  if (
    typeof body.featureKey !== "string" ||
    !FEATURE_KEYS.includes(body.featureKey as (typeof FEATURE_KEYS)[number]) ||
    typeof body.amount !== "number" ||
    typeof body.donorName !== "string" ||
    typeof body.message !== "string" ||
    typeof body.paymentMethod !== "string" ||
    !PAYMENT_METHODS.has(body.paymentMethod) ||
    typeof body.anonymous !== "boolean"
  ) {
    return json({ error: "Lengkapi pilihan dukungan dengan data yang valid." }, 400);
  }
  if (!validateSupportText(body.donorName, body.message)) {
    return json({ error: "Nama maksimal 80 karakter dan pesan maksimal 240 karakter." }, 400);
  }
  if (body.anonymous && body.featureKey !== "anonim") {
    return json({ error: "Pilihan dukungan anonim tidak konsisten." }, 400);
  }
  if (body.featureKey === "anonim" && !body.anonymous) {
    return json({ error: "Jenis dukungan anonim harus menyembunyikan identitas pendukung." }, 400);
  }

  const admin = createAdminClient();
  if (!admin) return json({ error: "Layanan dukungan belum dikonfigurasi di server." }, 503);
  const { data: creator, error: creatorError } = await admin.from("creator_profiles")
    .select("user_id, username").eq("username", username.toLowerCase()).eq("is_public", true).maybeSingle();
  if (creatorError) return json({ error: "Profil kreator gagal diverifikasi." }, 503);
  if (!creator) return json({ error: "Kreator tidak ditemukan atau tidak dipublikasikan." }, 404);

  const { data: setting, error: settingError } = await admin.from("creator_feature_settings")
    .select("enabled, minimum_amount, configuration")
    .eq("user_id", creator.user_id).eq("feature_key", body.featureKey).maybeSingle();
  if (settingError) return json({ error: "Status jenis dukungan gagal diverifikasi." }, 503);
  if (body.featureKey !== "saweran" && !setting?.enabled) {
    return json({ error: "Jenis dukungan ini sedang dinonaktifkan oleh kreator." }, 409);
  }

  const configuration = setting?.configuration && typeof setting.configuration === "object" && !Array.isArray(setting.configuration)
    ? setting.configuration as Record<string, unknown> : {};
  if (["anonim", "mediashare", "voicenote"].includes(body.featureKey) && configuration.enabled === false) {
    return json({ error: "Jenis dukungan ini sedang dinonaktifkan oleh kreator." }, 409);
  }
  const minimumAmount = normalizedMinimum(setting?.minimum_amount);
  if (!validateSupportAmount(body.amount, minimumAmount)) {
    return json({ error: `Nominal harus minimal Rp${minimumAmount.toLocaleString("id-ID")}, maksimal Rp100.000.000, dan kelipatan Rp1.000.` }, 400);
  }

  // Payment providers are intentionally not configured. This preflight verifies
  // the intent and current creator settings but never creates a donation or takes money.
  return json({
    ok: false,
    code: "checkout_disabled",
    message: "Data dukungan valid, tetapi checkout belum aktif karena provider pembayaran belum dikonfigurasi.",
    creatorUsername: creator.username,
    featureKey: body.featureKey,
    amount: body.amount,
    minimumAmount,
    paymentMethod: body.paymentMethod
  }, 409);
}
