import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
async function source(path) {
  return readFile(new URL(path, ROOT), "utf8");
}

test("overlay resolver fails closed for disabled anonymous, mediashare, and voice-note modules", async () => {
  const route = await source("src/app/api/overlay/[token]/route.ts");
  assert.match(route, /function moduleEnabled\(featureKey: string, configuration: unknown\)/);
  assert.match(route, /featureKey !== "anonim" && featureKey !== "mediashare" && featureKey !== "voicenote"/);
  assert.match(route, /if \(!moduleEnabled\(featureKey, configuration\)\) return null/);
  assert.match(route, /return moduleEnabled\(row\.feature_key as string, configuration\)/);
});

test("all 17 feature keys have a dedicated event mapping", async () => {
  const route = await source("src/app/api/overlay/[token]/route.ts");
  const map = route.match(/const featureEventTypes: Record<string, string\[]> = \{([\s\S]*?)\n\};/);
  assert.ok(map, "feature event map must exist");
  const keys = [
    "saweran", "anonim", "pesan", "target", "mediashare", "voicenote", "lagu", "qris",
    "leaderboard", "subathon", "running-text", "soundboard", "polling", "vip-queue",
    "bagpao", "gachaton", "bidcoin"
  ];
  for (const key of keys) {
    assert.ok(new RegExp('(?:^|\\n)\\s*"?'+key+'"?:\\s*\\[').test(map[1]), "missing event mapping for " + key);
  }
});

test("overlay API disables caching and limits event acknowledgement to the resolved creator and feature", async () => {
  const route = await source("src/app/api/overlay/[token]/route.ts");
  assert.match(route, /"Cache-Control": "no-store, max-age=0"/);
  assert.match(route, /\.eq\("user_id", resolved\.userId\)/);
  assert.match(route, /\.eq\("status", "pending"\)/);
  assert.match(route, /\.gt\("expires_at", new Date\(\)\.toISOString\(\)\)/);
  assert.match(route, /acknowledgeQuery = acknowledgeQuery\.in\("event_type", resolved\.eventTypes\)/);
});

test("overlay token lifecycle requires authenticated owner and never stores raw tokens", async () => {
  const route = await source("src/app/api/streaming/overlay-links/route.ts");
  assert.match(route, /await currentUser\(\)/);
  assert.match(route, /randomBytes\(32\)\.toString\("base64url"\)/);
  assert.match(route, /createHash\("sha256"\)\.update\(token\)\.digest\("hex"\)/);
  assert.match(route, /token_hash: tokenHash/);
  assert.doesNotMatch(route, /token_hash:\s*token\s*[,}]/);
  assert.match(route, /\.eq\("user_id", user\.id\)/);
  assert.match(route, /\.eq\("feature_key", body\.featureKey\)/);
});

test("feature test-alerts are authenticated, rate limited by database policy, and respect feature activation", async () => {
  const route = await source("src/app/api/streaming/overlay-links/test/route.ts");
  assert.ok(route.includes("supabase.auth.getUser()"));
  assert.match(route, /enqueue_feature_test_alert/);
  assert.match(route, /rate_limited/);
  assert.match(route, /featureSettings\?\.enabled !== true/);
  assert.match(route, /featureSettings\.overlay_enabled !== true/);
  assert.match(route, /moduleEnabled\(body\.featureKey, featureSettings\.configuration\)/);
});


test("anonymous module switch is consistent across test alerts and verified event RPC", async () => {
  const testRoute = await source("src/app/api/streaming/overlay-links/test/route.ts");
  const migration = await source("supabase/migrations/20261024100000_enforce_anonymous_overlay_module_gate.sql");
  assert.match(testRoute, /featureKey !== "anonim" && featureKey !== "mediashare" && featureKey !== "voicenote"/);
  assert.match(migration, /p_feature_key in \('anonim', 'mediashare', 'voicenote'\)/);
  assert.match(migration, /feature_or_overlay_disabled/);
});


test("verified feature event migration expands the original test-only event_type constraint", async () => {
  const migration = await source("supabase/migrations/20261024100000_enforce_anonymous_overlay_module_gate.sql");
  assert.match(migration, /drop constraint if exists alert_events_event_type_check/);
  assert.match(migration, /check \(event_type in \(/);
  assert.match(migration, /'test', 'donation', 'sandbox_donation'/);
  assert.match(migration, /'donation_anonymous'/);
  assert.match(migration, /'song_request'/);
});


test("creator feature settings have an explicit browser-role deny policy", async () => {
  const migration = await source("supabase/migrations/20261024120000_deny_client_creator_feature_settings.sql");
  assert.match(migration, /for all\s+to anon, authenticated/i);
  assert.match(migration, /using \(false\)/);
  assert.match(migration, /with check \(false\)/);
});


test("database test-alert RPC rechecks feature, overlay, module and token state atomically", async () => {
  const migration = await source("supabase/migrations/20261024130000_atomic_feature_overlay_test_gate.sql");
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /from public\.creator_feature_settings/);
  assert.match(migration, /v_feature_enabled is distinct from true or v_overlay_enabled is distinct from true/);
  assert.match(migration, /p_feature_key in \('anonim', 'mediashare', 'voicenote'\)/);
  assert.match(migration, /from public\.creator_feature_overlay_tokens/);
  assert.match(migration, /grant execute on function public\.enqueue_feature_test_alert\(uuid, text\) to service_role/);
  assert.match(migration, /revoke all on function public\.enqueue_feature_test_alert\(uuid, text\) from anon, authenticated/);
});


test("overlay client plays a built-in chime only when the creator has sound enabled", async () => {
  const client = await source("src/components/overlay-client.tsx");
  assert.match(client, /if \(!activeAlert \|\| !settings\.sound_enabled\) return/);
  assert.match(client, /new window\.AudioContext\(\)/);
  assert.match(client, /oscillator\.frequency\.setValueAtTime\(frequency, start\)/);
  assert.match(client, /if \(context\) void context\.close\(\)\.catch/);
});


test("feature module settings reset module-scoped form and activation state on navigation", async () => {
  const component = await source("src/components/feature-module-settings.tsx");
  assert.match(component, /setActivationLoading\(true\);\s*setNotice\(""\);\s*setFeatureEnabled\(false\);\s*setOverlayEnabled\(false\);/);
  assert.match(component, /setValues\(Object\.fromEntries\(fields\.map\(\(field\) => \[field\.key, field\.initial \?\? ""\]\)\)\);/);
  assert.match(component, /\}, \[storageKey, featureKey\]\);/);
});
