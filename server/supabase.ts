import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log("[Supabase Init] Starting initialization...");
console.log("[Supabase Init] SUPABASE_URL:", supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : "NOT SET");
console.log("[Supabase Init] SUPABASE_SERVICE_KEY:", supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : "NOT SET");

if (!supabaseUrl || !supabaseServiceKey) {
  const error = "CRITICAL: Supabase credentials not set. Auth will fail!";
  console.error(error);
  throw new Error(error);
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

console.log("[Supabase Init] Client created successfully");
