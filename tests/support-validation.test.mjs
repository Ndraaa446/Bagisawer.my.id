import test from "node:test";
import assert from "node:assert/strict";

const MAX_AMOUNT = 100_000_000;
const MIN_AMOUNT = 1_000;

function validateAmount(value, minimum = MIN_AMOUNT) {
  return Number.isFinite(value)
    && Number.isSafeInteger(value)
    && value >= minimum
    && value <= MAX_AMOUNT
    && value % 1_000 === 0;
}

function validateText(name, message) {
  return typeof name === "string"
    && typeof message === "string"
    && name.trim().length <= 80
    && message.trim().length <= 240;
}

test("accepts valid donation amounts at and above the minimum", () => {
  assert.equal(validateAmount(1_000), true);
  assert.equal(validateAmount(25_000), true);
  assert.equal(validateAmount(100_000_000), true);
});

test("rejects invalid, unsafe, out-of-range, and non-1000-increment amounts", () => {
  for (const value of [0, 999, 1_500, 100_001_000, -1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(validateAmount(value), false, String(value));
  }
});

test("enforces the selected feature minimum", () => {
  assert.equal(validateAmount(5_000, 10_000), false);
  assert.equal(validateAmount(10_000, 10_000), true);
});

test("accepts text within documented limits", () => {
  assert.equal(validateText("Supporter", "Semangat!"), true);
  assert.equal(validateText("a".repeat(80), "b".repeat(240)), true);
});

test("rejects oversized name and message", () => {
  assert.equal(validateText("a".repeat(81), "ok"), false);
  assert.equal(validateText("ok", "b".repeat(241)), false);
});
