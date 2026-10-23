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

