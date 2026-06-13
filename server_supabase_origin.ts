import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log("[Supabase Init] Starting initialization...");
console.log("[Supabase Init] SUPABASE_URL:", supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "NOT SET");
console.log("[Supabase Init] SUPABASE_SERVICE_KEY:", supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : "NOT SET");

export const isDevMode = !supabaseUrl || !supabaseServiceKey;

let supabaseAdmin: SupabaseClient;

if (isDevMode) {
  console.warn("[DEV MODE] Supabase credentials not set. Running with mock auth.");
  console.warn("[DEV MODE] All requests will use a mock user (dev-user-123).");
  // Create a dummy client that will be bypassed in dev mode
  supabaseAdmin = null as unknown as SupabaseClient;
} else {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  console.log("[Supabase Init] Client created successfully");
}

export { supabaseAdmin };
