import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StreamingSettings } from "@/components/streaming-settings";

export const metadata = { title: "Livestream & OBS — Bagisawer" };

const defaults = {
  alert_enabled: true,
  minimum_amount: 1000,
  duration_seconds: 6,
  theme: "violet" as const,
  sound_enabled: true
};

export default async function StreamingPage() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  const { data } = await supabase
    .from("creator_stream_settings")
    .select("user_id, alert_enabled, minimum_amount, duration_seconds, theme, sound_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  const initialSettings = data ? {
    ...data,
    theme: data.theme as "violet" | "minimal" | "neon"
  } : { ...defaults, user_id: user.id };

  return <StreamingSettings initialSettings={initialSettings} email={user.email ?? ""} />;
}
