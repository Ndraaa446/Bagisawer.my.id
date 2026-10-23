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
  assert.match(route, /select\("enabled, overlay_enabled, configuration"\)/);
  assert.match(route, /featureSetting\?\.enabled !== true/);
  assert.match(route, /featureSetting\.overlay_enabled !== true/);
  assert.match(route, /moduleEnabled\(body\.featureKey, featureSetting\.configuration\)/);
  assert.ok(route.indexOf("featureSetting?.enabled !== true") < route.indexOf("randomBytes(32)"),
    "feature status must be checked before creating a token");
});

test("disabling a feature or overlay revokes its existing feature token", async () => {
  const settings = await source("src/app/api/streaming/feature-settings/route.ts");
  const links = await source("src/app/api/streaming/overlay-links/route.ts");
  assert.match(settings, /if \\(!nextEnabled \\|\\| !nextOverlayEnabled\\)/);
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
  assert.match(route, /moduleEnabled\(body\.featureKey, featureSettings\.configuration\)/);
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
  assert.match(producer, /Do not call it from a return URL/);
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

test("feature overlay message length configuration is applied to visible alert text", async () => {
  const overlayClient = await source("src/components/overlay-client.tsx");
  assert.match(overlayClient, /const visibleMessage = activeAlert\?\.message \? activeAlert\.message\.slice/);
  assert.match(overlayClient, /<p>\{visibleMessage\}<\/p>/);
  assert.doesNotMatch(overlayClient, /<p>\{activeAlert\.message\}<\/p>/);
});

test("anonymous support selection is bound to the anonymous feature before a future payment flow", async () => {
  const supportPage = await source("src/app/[username]/dukung/page.tsx");
  assert.match(supportPage, /setSelectedFeature\(anonymousEnabled \? "anonim" : "saweran"\)/);
  assert.match(supportPage, /checked=\{selectedFeature === "anonim"\}/);
  assert.match(supportPage, /disabled=\{selectedFeature === "anonim"\}/);
  assert.match(supportPage, /if \(feature\.key === "anonim"\) setName\(""\)/);
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


test("feature module date and domain validation use real regex escapes", async () => {
  const component = await source("src/components/feature-module-settings.tsx");
  assert.match(component, /const match = \/\^\(\\d\{4\}\)-\(\\d\{2\}\)-\(\\d\{2\}\)\$\//,
    "date validation must recognize YYYY-MM-DD digits");
  assert.match(component, /value\.split\(\/\\r\?\\n\/\)/,
    "domain validation must split on actual line breaks");
  assert.match(component, /\[a-zA-Z0-9-\]\{0,61\}\[a-zA-Z0-9\]\)\?\\\.\)/,
    "domain validation must recognize hostname dots");
});

test("feature module reset clearly states that restored values are not saved automatically", async () => {
  const component = await source("src/components/feature-module-settings.tsx");
  assert.match(component, />Reset formulir<\/button>/);
  assert.match(component, /belum disimpan ke server\. Klik Simpan pengaturan/);
});


test("feature overlays fail closed when mediashare or voice-note module configuration is disabled", async () => {
  const route = await source("src/app/api/overlay/[token]/route.ts");
  assert.match(route, /\(featureKey === "mediashare" \|\| featureKey === "voicenote"\) && configuration\.enabled === false/);
  assert.match(route, /select\("feature_key, configuration"\)/);
  assert.match(route, /return !\(\["mediashare", "voicenote"\]\.includes\(row\.feature_key\) && configuration\.enabled === false\)/);
});


test("overlay-link state and test alerts honor module switches and normalized minimum amounts", async () => {
  const links = await source("src/app/api/streaming/overlay-links/route.ts");
  const testRoute = await source("src/app/api/streaming/overlay-links/test/route.ts");
  const featureSettings = await source("src/app/api/streaming/feature-settings/route.ts");
  const supportOptions = await source("src/app/api/creators/[username]/support-options/route.ts");
  const producer = await source("supabase/migrations/20261023110000_verified_feature_event_producer.sql");
  assert.match(links, /function normalizeMinimumAmount\(value: unknown\)/);
  assert.match(links, /minimumAmount: normalizeMinimumAmount\(setting\?\.minimum_amount\)/);
  assert.match(links, /moduleEnabled\(featureKey, setting\.configuration\)/);
  assert.match(testRoute, /moduleEnabled\(body\.featureKey, featureSettings\.configuration\)/);
  assert.match(featureSettings, /Number\(body\.minimumAmount\) % 1000 !== 0/);
  assert.match(supportOptions, /normalizeMinimumAmount\(row\?\.minimum_amount\)/);
  assert.match(producer, /p_amount < coalesce\(v_minimum_amount, 1000\)/);
  assert.match(producer, /configuration ->> 'enabled'/);
});


test("donation page adjusts the selected amount when the active feature minimum changes", async () => {
  const page = await source("src/app/[username]/dukung/page.tsx");
  assert.match(page, /const currentFeature = features\.find\(\(feature\) => feature\.key === selectedFeature\)/);
  assert.match(page, /if \(amount < minimum\)/);
  assert.match(page, /const nextPreset = amounts\.find\(\(value\) => value >= minimum\)/);
  assert.match(page, /else setCustomAmount\(String\(minimum\)\)/);
});

test("module-specific disable switch is reflected in dashboard state and revokes overlay URLs", async () => {
  const route = await source("src/app/api/streaming/feature-settings/route.ts");
  assert.match(route, /function moduleEnabled\(featureKey: FeatureKey, configuration: unknown\)/);
  assert.match(route, /const enabled = active && moduleActive/);
  assert.match(route, /overlayEnabled: enabled && Boolean\(row\?\.overlay_enabled\)/);
  assert.match(route, /const nextConfiguration = body\.configuration === undefined/);
  assert.match(route, /const nextEnabled = body\.enabled && moduleActive/);
  assert.match(route, /if \(!nextEnabled \|\| !nextOverlayEnabled\)/);
  assert.match(route, /overlayRevoked: !nextEnabled \|\| !nextOverlayEnabled/);
});

test("feature settings load canonical database minimum after legacy configuration values", async () => {
  const component = await source("src/components/feature-module-settings.tsx");
  assert.match(component, /\.\.\.\(item\.configuration as Record<string, string \| number \| boolean>\),[\s\S]*Number\.isSafeInteger\(item\.minimumAmount\) \? \{ minimum: item\.minimumAmount \}/);
});
