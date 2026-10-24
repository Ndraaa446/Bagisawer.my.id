import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ token: string }> };

const featureEventTypes: Record<string, string[]> = {
  saweran: ["test", "donation", "sandbox_donation"],
  anonim: ["anonim", "donation_anonymous"],
  pesan: ["pesan", "donation_message"],
  target: ["target", "goal", "milestone"],
  mediashare: ["mediashare"],
  voicenote: ["voicenote"],
  lagu: ["lagu", "song_request"],
  qris: ["qris"],
  leaderboard: ["leaderboard"],
  subathon: ["subathon"],
  "running-text": ["running-text"],
  soundboard: ["soundboard"],
  polling: ["polling"],
  "vip-queue": ["vip-queue"],
  bagpao: ["bagpao"],
  gachaton: ["gachaton"],
  bidcoin: ["bidcoin"]
};

function moduleEnabled(featureKey: string, configuration: unknown): boolean {
  if (featureKey !== "anonim" && featureKey !== "mediashare" && featureKey !== "voicenote") return true;
  if (!configuration || typeof configuration !== "object" || Array.isArray(configuration)) return true;
  return (configuration as Record<string, unknown>).enabled !== false;
}

async function resolveToken(token: string) {
  if (!token || token.length < 40 || token.length > 100) return null;
  const admin = createAdminClient();
  if (!admin) return null;

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data: featureToken, error: featureError } = await admin
    .from("creator_feature_overlay_tokens")
    .select("user_id, feature_key")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (featureError) return null;
  if (featureToken) {
    const featureKey = featureToken.feature_key as string;
    const { data: featureSetting, error: featureSettingError } = await admin
      .from("creator_feature_settings")
      .select("enabled, overlay_enabled, configuration")
      .eq("user_id", featureToken.user_id)
      .eq("feature_key", featureKey)
      .maybeSingle();
    if (featureSettingError || featureSetting?.enabled !== true || featureSetting?.overlay_enabled !== true) return null;
    const configuration = featureSetting.configuration && typeof featureSetting.configuration === "object" && !Array.isArray(featureSetting.configuration)
      ? featureSetting.configuration as Record<string, unknown>
      : {};
    // Mediashare and voice notes have a module-level switch in addition to the
    // shared feature/overlay switches. Fail closed here too, so an old token
    // cannot keep serving a module that its creator disabled in module settings.
    if (!moduleEnabled(featureKey, configuration)) return null;
    return {
      admin,
      userId: featureToken.user_id as string,
      featureKey,
      featureConfiguration: configuration,
      eventTypes: featureEventTypes[featureKey] ?? [featureKey],
      excludeEventTypes: null as string[] | null
    };
  }

  // Keep previously-issued general OBS tokens working, but do not let them
  // consume events already assigned to active per-feature overlays.
  const { data, error } = await admin
    .from("overlay_tokens")
    .select("user_id")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !data) return null;
  const userId = data.user_id as string;
  const { data: activeFeatureTokens, error: activeFeatureError } = await admin
    .from("creator_feature_overlay_tokens")
    .select("feature_key")
    .eq("user_id", userId)
    .is("revoked_at", null);
  if (activeFeatureError) return null;
  const featureKeys = Array.from(new Set((activeFeatureTokens ?? []).map((row) => row.feature_key as string)));
  let enabledFeatureKeys: string[] = [];
  if (featureKeys.length) {
    const { data: featureSettings, error: featureSettingsError } = await admin
      .from("creator_feature_settings")
      .select("feature_key, configuration")
      .eq("user_id", userId)
      .eq("enabled", true)
      .eq("overlay_enabled", true)
      .in("feature_key", featureKeys);
    if (featureSettingsError) return null;
    enabledFeatureKeys = (featureSettings ?? []).filter((row) => {
      const configuration = row.configuration && typeof row.configuration === "object" && !Array.isArray(row.configuration)
        ? row.configuration as Record<string, unknown>
        : {};
      return moduleEnabled(row.feature_key as string, configuration);
    }).map((row) => row.feature_key as string);
  }
  const excludeEventTypes = Array.from(new Set(enabledFeatureKeys.flatMap((key) =>
    featureEventTypes[key] ?? [key]
  )));
  return { admin, userId, featureKey: "general", featureConfiguration: {} as Record<string, unknown>, eventTypes: null as string[] | null, excludeEventTypes };
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

function postgrestInList(values: string[]) {
  return "(" + values.map((value) => '"' + value.replace(/"/g, '\\"') + '"').join(",") + ")";
}

export async function GET(_request: Request, context: Context) {
  const { token } = await context.params;
  const resolved = await resolveToken(token);
  if (!resolved) {
    if (!createAdminClient()) return noStoreJson({ error: "Overlay belum dikonfigurasi." }, 503);
    return notFound();
  }

  const { admin, userId, featureKey, featureConfiguration, eventTypes, excludeEventTypes } = resolved;
  const { data: settings, error: settingsError } = await admin
    .from("creator_stream_settings")
    .select("alert_enabled, minimum_amount, duration_seconds, theme, sound_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (settingsError) return noStoreJson({ error: "Pengaturan overlay belum dapat dibaca." }, 503);

  let event = null;
  if (settings?.alert_enabled !== false) {
    let eventQuery = admin
      .from("alert_events")
      .select("id, event_type, source, donor_name, message, amount, created_at")
      .eq("user_id", userId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(1);
    if (eventTypes) eventQuery = eventQuery.in("event_type", eventTypes);
    if (excludeEventTypes?.length) eventQuery = eventQuery.not("event_type", "in", postgrestInList(excludeEventTypes));
    const { data, error: eventError } = await eventQuery.maybeSingle();

    if (eventError) return noStoreJson({ error: "Antrean alert belum dapat dibaca." }, 503);
    event = data;
    if (event && featureKey === "anonim") {
      event = { ...event, donor_name: "Anonim" };
    }
  }

  return noStoreJson({
    featureKey,
    featureConfiguration,
    settings: settings ?? { alert_enabled: true, minimum_amount: 1000, duration_seconds: 6, theme: "violet", sound_enabled: true },
    event
  });
}

export async function POST(request: Request, context: Context) {
  const { token } = await context.params;
  const resolved = await resolveToken(token);
  if (!resolved) {
    if (!createAdminClient()) return noStoreJson({ error: "Overlay belum dikonfigurasi." }, 503);
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

  let acknowledgeQuery = resolved.admin
    .from("alert_events")
    .update({ status: "displayed", displayed_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", body.eventId)
    .eq("user_id", resolved.userId)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString());
  if (resolved.eventTypes) acknowledgeQuery = acknowledgeQuery.in("event_type", resolved.eventTypes);
  if (resolved.excludeEventTypes?.length) {
    acknowledgeQuery = acknowledgeQuery.not("event_type", "in", postgrestInList(resolved.excludeEventTypes));
  }
  const { error, count } = await acknowledgeQuery;

  if (error) return noStoreJson({ error: "Event belum dapat ditandai selesai." }, 500);
  if (count === 0) return noStoreJson({ ok: true, alreadyHandled: true });
  return noStoreJson({ ok: true });
}
