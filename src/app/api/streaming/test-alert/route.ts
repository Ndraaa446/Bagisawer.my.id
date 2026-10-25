import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Sesi masuk diperlukan." }, {
      status: 401,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Layanan overlay belum dikonfigurasi di server." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" }
    });
  }

  // The database function serializes requests per creator so concurrent clicks
  // cannot bypass the cooldown. It also rechecks token/settings server-side.
  const { data, error } = await admin.rpc("enqueue_test_alert", {
    p_user_id: user.id
  });

  if (error || !data || typeof data !== "object") {
    return NextResponse.json({ error: "Alert uji belum dapat dibuat." }, {
      status: 500,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const result = data as { ok?: boolean; reason?: string };
  if (result.ok) {
    return NextResponse.json({
      ok: true,
      message: "Alert uji masuk ke antrean overlay."
    }, { headers: { "Cache-Control": "no-store" } });
  }

  if (result.reason === "token_inactive") {
    return NextResponse.json({ error: "Buat URL overlay terlebih dahulu." }, {
      status: 409,
      headers: { "Cache-Control": "no-store" }
    });
  }
  if (result.reason === "alerts_disabled") {
    return NextResponse.json({ error: "Aktifkan alert terlebih dahulu di pengaturan." }, {
      status: 409,
      headers: { "Cache-Control": "no-store" }
    });
  }
  if (result.reason === "rate_limited") {
    return NextResponse.json({ error: "Tunggu beberapa detik sebelum mengirim alert uji lagi." }, {
      status: 429,
      headers: { "Cache-Control": "no-store" }
    });
  }

  return NextResponse.json({ error: "Alert uji ditolak oleh pengaman server." }, {
    status: 409,
    headers: { "Cache-Control": "no-store" }
  });
}
