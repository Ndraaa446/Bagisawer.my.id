import test from "node:test";
import assert from "node:assert/strict";
import { validateFeatureConfiguration } from "../src/lib/feature-config-validation.js";

test("accepts supported module settings with expected primitive types", () => {
  assert.equal(validateFeatureConfiguration("saweran", {
    enabled: true, minimum: 1000, suggested: "10000, 25000", anonymous: true, messageLimit: 240
  }), true);
  assert.equal(validateFeatureConfiguration("polling", {
    question: "Pilihan malam ini?", options: "A\nB", duration: 5, oneVote: true
  }), true);
  assert.equal(validateFeatureConfiguration("mediashare", {
    enabled: false, duration: 120, domains: "youtube.com\nwww.twitch.tv", review: true
  }), true);
});

test("rejects unknown module keys, invalid types, and unsafe numeric ranges", () => {
  assert.equal(validateFeatureConfiguration("saweran", { enabled: true, admin: true }), false);
  assert.equal(validateFeatureConfiguration("saweran", { minimum: "1000" }), false);
  assert.equal(validateFeatureConfiguration("subathon", { initial: 60, perAmount: -1, cap: 720 }), false);
  assert.equal(validateFeatureConfiguration("soundboard", { volume: 101, cooldown: 10 }), false);
  assert.equal(validateFeatureConfiguration("unknown", {}), false);
});

test("validates suggested amounts, domain lists, and calendar dates", () => {
  assert.equal(validateFeatureConfiguration("saweran", { suggested: "10000,25000,50000" }), true);
  assert.equal(validateFeatureConfiguration("saweran", { suggested: "10000,25001" }), false);
  assert.equal(validateFeatureConfiguration("mediashare", { domains: "youtube.com\nexample.org" }), true);
  assert.equal(validateFeatureConfiguration("mediashare", { domains: "https://youtube.com/watch?v=1" }), false);
  assert.equal(validateFeatureConfiguration("target", { deadline: "2026-02-30" }), false);
  assert.equal(validateFeatureConfiguration("target", { deadline: "2026-02-28" }), true);
});

test("rejects oversized or non-object configuration payloads", () => {
  assert.equal(validateFeatureConfiguration("pesan", null), false);
  assert.equal(validateFeatureConfiguration("pesan", []), false);
  assert.equal(validateFeatureConfiguration("pesan", { blocked: "x".repeat(2001) }), false);
});


test("accepts saved settings for non-payment ecosystem modules", () => {
  assert.equal(validateFeatureConfiguration("store", { supplier: "Belum dipilih", limit: 24, refund: 7 }), true);
  assert.equal(validateFeatureConfiguration("notifikasi", { inApp: true, email: false, events: "Pembayaran, keamanan" }), true);
  assert.equal(validateFeatureConfiguration("kompetisi", { title: "Event komunitas", period: "November", scoring: "Aturan transparan" }), true);
});


test("enforces per-feature numeric ranges rather than a shared generic limit", () => {
  assert.equal(validateFeatureConfiguration("leaderboard", { limit: 101 }), false);
  assert.equal(validateFeatureConfiguration("leaderboard", { limit: 3 }), true);
  assert.equal(validateFeatureConfiguration("running-text", { duration: 61 }), false);
  assert.equal(validateFeatureConfiguration("running-text", { duration: 12, limit: 120 }), true);
  assert.equal(validateFeatureConfiguration("voicenote", { duration: 181 }), false);
  assert.equal(validateFeatureConfiguration("store", { limit: 501 }), false);
});
