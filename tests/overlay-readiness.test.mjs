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
  assert.match(route, /await currentUser\(\)/);
  assert.match(route, /enqueue_feature_test_alert/);
  assert.match(route, /rate_limited/);
  assert.match(route, /featureSettings\?\.enabled !== true/);
  assert.match(route, /featureSettings\.overlay_enabled !== true/);
  assert.match(route, /moduleEnabled\(body\.featureKey, featureSettings\.configuration\)/);
});
