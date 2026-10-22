import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Return to login even if the session is already expired.
  }
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}