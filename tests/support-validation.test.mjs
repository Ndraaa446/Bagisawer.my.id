import test from "node:test";
import assert from "node:assert/strict";
import { validateSupportAmount, validateSupportText } from "../src/lib/support-validation.js";

test("accepts valid donation amounts at and above the minimum", () => {
  assert.equal(validateSupportAmount(1_000), true);
  assert.equal(validateSupportAmount(25_000), true);
  assert.equal(validateSupportAmount(100_000_000), true);
});

test("rejects invalid, unsafe, out-of-range, and non-1000-increment amounts", () => {
  for (const value of [0, 999, 1_500, 100_001_000, -1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(validateSupportAmount(value), false, String(value));
  }
});

test("enforces the selected feature minimum and rejects invalid minimums", () => {
  assert.equal(validateSupportAmount(5_000, 10_000), false);
  assert.equal(validateSupportAmount(10_000, 10_000), true);
  assert.equal(validateSupportAmount(10_000, 0), false);
  assert.equal(validateSupportAmount(10_000, 1_000.5), false);
});

test("accepts text within documented limits", () => {
  assert.equal(validateSupportText("Supporter", "Semangat!"), true);
  assert.equal(validateSupportText("a".repeat(80), "b".repeat(240)), true);
});

test("rejects oversized name and message", () => {
  assert.equal(validateSupportText("a".repeat(81), "ok"), false);
  assert.equal(validateSupportText("ok", "b".repeat(241)), false);
});
