import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function unavailable() {
  return NextResponse.json(
    { error: "Token overlay belum tersedia. Pastikan SUPABASE_SERVICE_ROLE_KEY atau SUPABASE_SECRET_KEY disetel hanya di server." },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );
}

async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return error || !user ? null : user;
}

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sesi masuk diperlukan." }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return unavailable();

  const { data, error } = await admin
    .from("overlay_tokens")
    .select("revoked_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Status overlay belum dapat diperiksa." }, { status: 500 });
  return NextResponse.json({ active: Boolean(data && !data.revoked_at) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sesi masuk diperlukan." }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return unavailable();

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { error } = await admin.from("overlay_tokens").upsert({
    user_id: user.id,
    token_hash: tokenHash,
    created_at: new Date().toISOString(),
    revoked_at: null,
    last_used_at: null
  }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: "Token overlay gagal dibuat. Coba lagi." }, { status: 500 });

  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const origin = configuredOrigin || new URL(request.url).origin;
  return NextResponse.json({
    url: `${origin}/overlay/${token}`,
    warning: "URL ini adalah rahasia. Salin dan simpan sekarang; token mentah tidak disimpan dan tidak dapat ditampilkan ulang."
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sesi masuk diperlukan." }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return unavailable();

  const { error } = await admin
    .from("overlay_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("revoked_at", null);

  if (error) return NextResponse.json({ error: "Token overlay gagal dicabut." }, { status: 500 });
  return NextResponse.json({ active: false }, { headers: { "Cache-Control": "no-store" } });
}
