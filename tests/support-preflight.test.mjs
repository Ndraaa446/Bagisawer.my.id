import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateSupportAmount, validateSupportText } from "../src/lib/support-validation.js";

const ROOT = new URL("../", import.meta.url);
async function source(path) {
  return readFile(new URL(path, ROOT), "utf8");
}

test("server-side support preflight enforces supported feature and payment method allowlists", async () => {
  const route = await source("src/app/api/creators/[username]/support-preflight/route.ts");
  assert.match(route, /const FEATURE_KEYS = \[/);
  assert.match(route, /const PAYMENT_METHODS = new Set\(/);
  assert.match(route, /!FEATURE_KEYS\.includes\(body\.featureKey as/);
  assert.match(route, /!PAYMENT_METHODS\.has\(body\.paymentMethod\)/);
  assert.match(route, /validateSupportText\(body\.donorName, body\.message\)/);
  assert.match(route, /validateSupportAmount\(body\.amount, minimumAmount\)/);
});

test("support preflight verifies a public creator and current feature activation before accepting intent", async () => {
  const route = await source("src/app/api/creators/[username]/support-preflight/route.ts");
  assert.match(route, /\.eq\("is_public", true\)\.maybeSingle\(\)/);
  assert.match(route, /from\("creator_feature_settings"\)/);
  assert.match(route, /if \(body\.featureKey !== "saweran" && !setting\?\.enabled\)/);
  assert.match(route, /configuration\.enabled === false/);
});

test("support preflight never creates a transaction while checkout is disabled", async () => {
  const route = await source("src/app/api/creators/[username]/support-preflight/route.ts");
  assert.match(route, /code: "checkout_disabled"/);
  assert.match(route, /}, 409\)/);
  assert.doesNotMatch(route, /from\("(?:donations|payment_transactions|sandbox_donations)"\)/);
  assert.doesNotMatch(route, /\.insert\(/);
});

test("shared support validators enforce server-side amount and text boundaries", () => {
  assert.equal(validateSupportAmount(10000, 10000), true);
  assert.equal(validateSupportAmount(5000, 10000), false);
  assert.equal(validateSupportAmount(10001, 10000), false);
  assert.equal(validateSupportText("Pendukung", "Semangat!"), true);
  assert.equal(validateSupportText("x".repeat(81), "ok"), false);
  assert.equal(validateSupportText("ok", "x".repeat(241)), false);
});


test("support amount validator covers the minimum, maximum, step and safe-integer boundaries", () => {
  assert.equal(validateSupportAmount(1000, 1000), true);
  assert.equal(validateSupportAmount(100000000, 1000), true);
  assert.equal(validateSupportAmount(999, 1000), false);
  assert.equal(validateSupportAmount(100000001, 1000), false);
  assert.equal(validateSupportAmount(1500, 1000), false);
  assert.equal(validateSupportAmount(1000.5, 1000), false);
  assert.equal(validateSupportAmount(Number.MAX_SAFE_INTEGER + 1, 1000), false);
  assert.equal(validateSupportAmount(10000, 999), false);
  assert.equal(validateSupportAmount(10000, 100000001), false);
});
