import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ token: string }> };

async function resolveToken(token: string) {
  if (!token || token.length < 40 || token.length > 100) return null;
  const admin = createAdminClient();
  if (!admin) return null;

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await admin
    .from("overlay_tokens")
    .select("user_id")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return { admin, userId: data.user_id as string };
}

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Referrer-Policy": "no-referrer"
    }
  });
}

function notFound() {
  return noStoreJson({ error: "Overlay tidak ditemukan atau token sudah dicabut." }, 404);
}

export async function GET(_request: Request, context: Context) {
  const { token } = await context.params;
  const resolved = await resolveToken(token);
  if (!resolved) {
    if (!createAdminClient()) {
      return noStoreJson({ error: "Overlay belum dikonfigurasi." }, 503);
    }
    return notFound();
  }

  const { admin, userId } = resolved;
  const { data: settings, error: settingsError } = await admin
    .from("creator_stream_settings")
    .select("alert_enabled, minimum_amount, duration_seconds, theme, sound_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (settingsError) {
    return noStoreJson({ error: "Pengaturan overlay belum dapat dibaca." }, 503);
  }

  let event = null;
  if (settings?.alert_enabled !== false) {
    const { data, error: eventError } = await admin
      .from("alert_events")
      .select("id, event_type, source, donor_name, message, amount, created_at")
      .eq("user_id", userId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (eventError) {
      return noStoreJson({ error: "Antrean alert belum dapat dibaca." }, 503);
    }
    event = data;
  }

  return noStoreJson({
    settings: settings ?? { alert_enabled: true, minimum_amount: 1000, duration_seconds: 6, theme: "violet", sound_enabled: true },
    event
  });
}

export async function POST(request: Request, context: Context) {
  const { token } = await context.params;
  const resolved = await resolveToken(token);
  if (!resolved) {
    if (!createAdminClient()) {
      return noStoreJson({ error: "Overlay belum dikonfigurasi." }, 503);
    }
    return notFound();
  }

  let body: { eventId?: unknown };
  try {
    body = await request.json();
  } catch {
    return noStoreJson({ error: "Permintaan tidak valid." }, 400);
  }

  if (typeof body.eventId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.eventId)) {
    return noStoreJson({ error: "ID event tidak valid." }, 400);
  }

  const { error, count } = await resolved.admin
    .from("alert_events")
    .update({ status: "displayed", displayed_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", body.eventId)
    .eq("user_id", resolved.userId)
    .eq("status", "pending");

  if (error) return noStoreJson({ error: "Event belum dapat ditandai selesai." }, 500);
  if (count === 0) return noStoreJson({ ok: true, alreadyHandled: true });
  return noStoreJson({ ok: true });
}
