const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const missing = required.filter((key) => !process.env[key]?.trim());

if (missing.length > 0) {
  console.error(`Missing required Netlify build environment variable(s): ${missing.join(", ")}`);
  process.exit(1);
}

console.log("Netlify build environment preflight passed (required public Supabase variables are present).");
