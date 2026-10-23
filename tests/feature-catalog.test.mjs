import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);
const FEATURE_KEYS = [
  "saweran", "anonim", "pesan", "target", "mediashare", "voicenote", "lagu", "qris",
  "leaderboard", "subathon", "running-text", "soundboard", "polling", "vip-queue",
  "bagpao", "gachaton", "bidcoin"
];

async function source(path) {
  return readFile(new URL(path, ROOT), "utf8");
}

function extractQuotedFeatureKeys(text) {
  const match = text.match(/const FEATURE_KEYS = \[([\s\S]*?)\] as const/);
  assert.ok(match, "FEATURE_KEYS catalog should exist");
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

test("public feature settings and overlay-link APIs expose the same 17-feature catalog", async () => {
  const [settings, links, supportOptions] = await Promise.all([
    source("src/app/api/streaming/feature-settings/route.ts"),
    source("src/app/api/streaming/overlay-links/route.ts"),
    source("src/app/api/creators/[username]/support-options/route.ts")
  ]);

  assert.deepEqual(extractQuotedFeatureKeys(settings), FEATURE_KEYS);
  assert.deepEqual(extractQuotedFeatureKeys(links), FEATURE_KEYS);
  assert.deepEqual(extractQuotedFeatureKeys(supportOptions), FEATURE_KEYS);
});

test("each feature has a dedicated overlay event mapping", async () => {
  const overlayRoute = await source("src/app/api/overlay/[token]/route.ts");
  const map = overlayRoute.match(/const featureEventTypes: Record<string, string\[]> = \{([\s\S]*?)\n\};/);
  assert.ok(map, "overlay event mapping should exist");

  for (const key of FEATURE_KEYS) {
    const escapedKey = key.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&");
    assert.match(map[1], new RegExp('(?:^|\\n)\\s*(?:"' + escapedKey + '"|' + escapedKey + '):\\s*\\['),
      `missing event mapping for ${key}`);
  }
});

test("feature overlay tokens cannot be issued for disabled features or overlays", async () => {
  const route = await source("src/app/api/streaming/overlay-links/route.ts");
  assert.match(route, /select\("enabled, overlay_enabled"\)/);
  assert.match(route, /featureSetting\?\.enabled !== true/);
  assert.match(route, /featureSetting\.overlay_enabled !== true/);
  assert.ok(route.indexOf("featureSetting?.enabled !== true") < route.indexOf("randomBytes(32)"),
    "feature status must be checked before creating a token");
});

test("disabling a feature or overlay revokes its existing feature token", async () => {
  const settings = await source("src/app/api/streaming/feature-settings/route.ts");
  const links = await source("src/app/api/streaming/overlay-links/route.ts");
  assert.match(settings, /if \(!body\.enabled \|\| !nextOverlayEnabled\)/);
  assert.match(settings, /creator_feature_overlay_tokens/);
  assert.match(settings, /\.update\(\{ revoked_at: new Date\(\)\.toISOString\(\) \}\)/);
  assert.match(settings, /\.eq\("user_id", user\.id\)/);
  assert.match(settings, /\.eq\("feature_key", body\.featureKey\)/);
  assert.match(links, /row && !row\.revoked_at && setting\?\.enabled === true && setting\?\.overlay_enabled === true/);
});

test("feature test-alert endpoint validates the catalog and refuses disabled overlays", async () => {
  const route = await source("src/app/api/streaming/overlay-links/test/route.ts");
  for (const key of FEATURE_KEYS) assert.ok(route.includes(`"${key}"`), `test endpoint missing ${key}`);
  assert.match(route, /featureSettings\?\.enabled !== true/);
  assert.match(route, /featureSettings\.overlay_enabled !== true/);
  assert.match(route, /enqueue_feature_test_alert/);
  assert.match(route, /rate_limited/);
});

test("feature alert source is allowed only for trusted server-side producers", async () => {
  const migration = await source("supabase/migrations/20261023100000_allow_server_feature_alert_sources.sql");
  const baseMigration = await source("supabase/migrations/20261022080022_overlay_tokens_and_test_alert_events.sql");
  assert.match(migration, /source in \('test', 'feature'\)/);
  assert.match(baseMigration, /event_type = 'test'/);
  assert.match(baseMigration, /source = 'test'/);
  assert.match(baseMigration, /grant select, insert on public\.alert_events to authenticated/);
  assert.match(migration, /Client-side RLS remains restricted to isolated test events/);
});

test("verified payment event producer is server-only and delegates idempotency and feature gates to SQL", async () => {
  const producer = await source("src/lib/streaming/verified-payment-events.ts");
  const migration = await source("supabase/migrations/20261023110000_verified_feature_event_producer.sql");
  assert.match(producer, /import "server-only"/);
  assert.match(producer, /providerEventId/);
  assert.match(producer, /enqueue_verified_feature_event/);
  assert.match(producer, /Do not call it from a return URL, client action, sandbox simulation/);
  assert.match(migration, /source_event_id/);
  assert.match(migration, /create unique index if not exists alert_events_source_event_unique_idx/);
  assert.match(migration, /on conflict \(user_id, source_event_id, event_type\)/);
  assert.match(migration, /feature_or_overlay_disabled/);
  assert.match(migration, /overlay_token_inactive/);
  assert.match(migration, /below_minimum/);
  assert.match(migration, /when p_feature_key = 'anonim' then 'Anonim'/);
  assert.match(migration, /revoke all on function public\.enqueue_verified_feature_event[\s\S]*from anon, authenticated/);
  assert.match(migration, /to service_role/);
});

test("sandbox payment endpoints are explicitly separate from live payment providers", async () => {
  const sandbox = await source("src/app/api/payments/sandbox/route.ts");
  const paymentDocs = await source("docs/PAYMENT_FLOW.md");
  assert.match(sandbox, /environment: "sandbox"/);
  assert.match(sandbox, /SIMULASI SAJA/);
  assert.match(paymentDocs, /No external payment provider is configured/);
  assert.match(paymentDocs, /Never treat a browser return URL as proof of payment/);
});
test("anonymous feature overlay redacts donor names even if stored upstream", async () => {
  const route = await source("src/app/api/overlay/[token]/route.ts");
  assert.match(route, /featureKey === "anonim"/);
  assert.match(route, /donor_name: "Anonim"/);
});

test("overlay acknowledgement is scoped to owner, event type and unexpired pending events", async () => {
  const route = await source("src/app/api/overlay/[token]/route.ts");
  assert.match(route, /\.eq\("user_id", resolved\.userId\)/);
  assert.match(route, /\.eq\("status", "pending"\)/);
  assert.match(route, /\.gt\("expires_at", new Date\(\)\.toISOString\(\)\)/);
  assert.match(route, /acknowledgeQuery = acknowledgeQuery\.in\("event_type", resolved\.eventTypes\)/);
});

