import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return jsonError("Sesi masuk diperlukan.", 401);

  const admin = createAdminClient();
  if (!admin) return jsonError("Sandbox memerlukan kunci rahasia Supabase khusus server yang belum dikonfigurasi.", 503);

  let body: { action?: unknown; amount?: unknown; donorName?: unknown; message?: unknown; reference?: unknown };
  try { body = await request.json(); } catch { return jsonError("JSON permintaan tidak valid.", 400); }

  if (body.action === "create") {
    const amount = body.amount;
    const donorName = typeof body.donorName === "string" ? body.donorName.trim() : "Pendukung Uji";
    const message = typeof body.message === "string" ? body.message.trim() : "SANDBOX · BUKAN DONASI NYATA";
    if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 1000 || amount > 100000000) {
      return jsonError("Nominal sandbox harus Rp1.000–Rp100.000.000.", 400);
    }
    if (!donorName || donorName.length > 80 || message.length > 240) return jsonError("Nama atau pesan terlalu panjang.", 400);

    const cutoff = new Date(Date.now() - 10 * 60_000).toISOString();
    const { count, error: rateError } = await admin.from("sandbox_donations")
      .select("id", { count: "exact", head: true })
      .eq("creator_user_id", user.id)
      .gte("created_at", cutoff);
    if (rateError) return jsonError("Batas permintaan sandbox belum dapat diperiksa.", 500);
    if ((count ?? 0) >= 5) return jsonError("Batas uji tercapai. Coba lagi dalam beberapa menit.", 429);

    const reference = `BSW-SBX-${randomBytes(8).toString("hex").toUpperCase()}`;
    const { data, error } = await admin.from("sandbox_donations").insert({
      creator_user_id: user.id,
      reference,
      donor_name: donorName,
      message,
      amount_idr: amount,
      currency: "IDR",
      status: "pending",
      environment: "sandbox"
    }).select("reference, amount_idr, currency, status, created_at").single();
    if (error || !data) return jsonError("Transaksi sandbox belum dapat dibuat.", 500);
    return NextResponse.json({ ok: true, donation: data, note: "SIMULASI SAJA — TIDAK ADA UANG YANG DITARIK." }, { headers: { "Cache-Control": "no-store" } });
  }

  if (body.action === "simulate_success") {
    if (typeof body.reference !== "string" || !/^BSW-SBX-[A-F0-9]{16}$/.test(body.reference)) {
      return jsonError("Referensi sandbox tidak valid.", 400);
    }
    const { data: donation, error: findError } = await admin.from("sandbox_donations")
      .select("id, reference, creator_user_id, donor_name, amount_idr, currency, status, message")
      .eq("reference", body.reference)
      .eq("creator_user_id", user.id)
      .eq("environment", "sandbox")
      .maybeSingle();
    if (findError) return jsonError("Transaksi sandbox gagal diperiksa.", 500);
    if (!donation) return jsonError("Transaksi sandbox tidak ditemukan.", 404);
    const eventId = `sandbox-success-${donation.reference}`;
    const canonical = JSON.stringify({ reference: donation.reference, eventId, eventType: "payment.succeeded", amount: donation.amount_idr, currency: donation.currency });
    const payloadHash = createHash("sha256").update(canonical).digest("hex");
    const { data: result, error: rpcError } = await admin.rpc("process_sandbox_payment_event", {
      p_reference: donation.reference,
      p_provider_event_id: eventId,
      p_event_type: "payment.succeeded",
      p_amount_idr: donation.amount_idr,
      p_currency: donation.currency,
      p_payload_hash: payloadHash
    });
    if (rpcError || !result) return jsonError("Simulasi pembayaran ditolak; periksa status transaksi.", 409);
    return NextResponse.json({ ok: true, result, note: "SIMULASI SAJA — BUKAN PEMBAYARAN NYATA." }, { headers: { "Cache-Control": "no-store" } });
  }

  return jsonError("Aksi sandbox tidak dikenal.", 400);
}
