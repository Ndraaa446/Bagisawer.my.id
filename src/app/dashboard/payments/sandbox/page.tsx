import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SandboxPayments } from "@/components/sandbox-payments";

export const dynamic = "force-dynamic";

export default async function SandboxPaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <SandboxPayments />;
}
