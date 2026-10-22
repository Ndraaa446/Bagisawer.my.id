import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const FEATURE_KEYS = [
  "saweran", "anonim", "pesan", "target", "mediashare", "voicenote", "lagu", "qris",
  "leaderboard", "subathon", "running-text", "soundboard", "polling", "vip-queue",
  "bagpao", "gachaton", "bidcoin"
] as const;
const FEATURE_LABELS: Record<(typeof FEATURE_KEYS)[number], { label: string; description: string; category: "donasi" | "interaksi" }> = {
  saweran: { label: "Saweran", description: "Dukungan nominal langsung", category: "donasi" },
  anonim: { label: "Dukungan anonim", description: "Kirim dukungan tanpa menampilkan nama", category: "donasi" },
  pesan: { label: "Pesan dukungan", description: "Sertakan pesan untuk kreator", category: "donasi" },
  target: { label: "Target dukungan", description: "Bantu progres target kreator", category: "donasi" },
  mediashare: { label: "Mediashare", description: "Ajukan media untuk ditampilkan saat livestream", category: "donasi" },
  voicenote: { label: "Voice note", description: "Kirim pesan suara", category: "donasi" },
  lagu: { label: "Request lagu", description: "Ajukan lagu ke antrean kreator", category: "donasi" },
  qris: { label: "QR dukungan", description: "Lihat QR menuju halaman dukungan", category: "donasi" },
  leaderboard: { label: "Leaderboard", description: "Dukung dan ikut peringkat pendukung", category: "interaksi" },
  subathon: { label: "Subathon", description: "Tambahkan waktu ke timer kreator", category: "interaksi" },
  "running-text": { label: "Running text", description: "Kirim teks berjalan", category: "interaksi" },
  soundboard: { label: "Soundboard", description: "Aktifkan suara yang diizinkan kreator", category: "interaksi" },
  polling: { label: "Polling", description: "Ikut polling kreator", category: "interaksi" },
  "vip-queue": { label: "VIP queue", description: "Masuk antrean prioritas", category: "interaksi" },
  bagpao: { label: "Bagpao", description: "Interaksi Bagpao", category: "interaksi" },
  gachaton: { label: "Gachaton", description: "Interaksi Gachaton", category: "interaksi" },
  bidcoin: { label: "Bidcoin", description: "Gunakan poin internal Bidcoin", category: "interaksi" }
};
function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}
export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const admin = createAdminClient();
  if (!admin) return json({ error: "Pilihan dukungan belum tersedia." }, 503);
  const { data: creator, error: creatorError } = await admin.from("creator_profiles")
    .select("user_id, username").eq("username", username.toLowerCase()).eq("is_public", true).maybeSingle();
  if (creatorError) return json({ error: "Pilihan dukungan belum dapat dimuat." }, 503);
  if (!creator) return json({ error: "Kreator tidak ditemukan." }, 404);
  const { data, error } = await admin.from("creator_feature_settings").select("feature_key, enabled, minimum_amount").eq("user_id", creator.user_id);
  if (error) return json({ error: "Pilihan dukungan belum dapat dimuat." }, 503);
  const enabled = new Set((data ?? []).filter((row) => row.enabled).map((row) => row.feature_key));
  enabled.add("saweran");
  return json({ features: FEATURE_KEYS.filter((key) => enabled.has(key)).map((key) => { const row = (data ?? []).find((item) => item.feature_key === key); return { key, ...FEATURE_LABELS[key], minimumAmount: row?.minimum_amount ?? 1000 }; }) });
}
