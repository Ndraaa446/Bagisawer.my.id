import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const VERIFIED_PAYMENT_FEATURE_KEYS = [
  "saweran", "anonim", "pesan", "target", "mediashare", "voicenote", "lagu", "qris",
  "leaderboard", "subathon", "running-text", "soundboard", "polling", "vip-queue",
  "bagpao", "gachaton", "bidcoin"
] as const;

export type VerifiedPaymentFeatureKey = typeof VERIFIED_PAYMENT_FEATURE_KEYS[number];

export type VerifiedPaymentFeatureEventInput = {
  /** Stable provider event ID from the signed webhook, not a browser-generated value. */
  providerEventId: string;
  /** Creator UUID resolved from the server-side pending payment record. */
  creatorUserId: string;
  featureKey: VerifiedPaymentFeatureKey;
  donorName?: string | null;
  message?: string | null;
  amountIdr: number;
};

export type VerifiedPaymentFeatureEventResult =
  | { ok: true; duplicate: boolean; eventId?: string }
  | { ok: false; reason: string };

/**
 * Enqueue an overlay event after the caller has verified the provider webhook
 * signature and matched the provider reference, amount, currency and payment
 * state to the server-side pending transaction.
 *
 * This helper does not verify a payment by itself. It is server-only, uses the
 * service role, and delegates feature/overlay/token/minimum/idempotency checks
 * to a SECURITY DEFINER database function. Do not call it from a return URL,
 * client action, sandbox simulation, or an unverified webhook.
 */
export async function enqueueVerifiedPaymentFeatureEvent(
  input: VerifiedPaymentFeatureEventInput
): Promise<VerifiedPaymentFeatureEventResult> {
  if (
    !input ||
    typeof input.providerEventId !== "string" ||
    input.providerEventId.trim().length < 1 ||
    input.providerEventId.length > 160 ||
    typeof input.creatorUserId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.creatorUserId) ||
    !VERIFIED_PAYMENT_FEATURE_KEYS.includes(input.featureKey) ||
    !Number.isSafeInteger(input.amountIdr) ||
    input.amountIdr < 1000 ||
    input.amountIdr > 100000000 ||
    (input.donorName != null && (typeof input.donorName !== "string" || input.donorName.length > 500)) ||
    (input.message != null && (typeof input.message !== "string" || input.message.length > 2000))
  ) {
    return { ok: false, reason: "invalid_payload" };
  }

  const admin = createAdminClient();
  if (!admin) return { ok: false, reason: "server_not_configured" };

  const { data, error } = await admin.rpc("enqueue_verified_feature_event", {
    p_user_id: input.creatorUserId,
    p_feature_key: input.featureKey,
    p_source_event_id: input.providerEventId.trim(),
    p_donor_name: input.donorName?.trim().slice(0, 80) || "Pendukung",
    p_message: input.message?.trim().slice(0, 240) || "Terima kasih atas dukungannya!",
    p_amount: input.amountIdr
  });

  if (error || !data || typeof data !== "object") {
    return { ok: false, reason: "enqueue_failed" };
  }

  const result = data as {
    ok?: boolean;
    duplicate?: boolean;
    eventId?: string;
    reason?: string;
  };

  if (result.ok !== true) {
    return { ok: false, reason: result.reason ?? "enqueue_rejected" };
  }

  return {
    ok: true,
    duplicate: result.duplicate === true,
    ...(typeof result.eventId === "string" ? { eventId: result.eventId } : {})
  };
}
