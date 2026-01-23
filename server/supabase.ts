import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  console.warn("SUPABASE_URL is not set - auth will not work");
}

if (!supabaseServiceKey) {
  console.warn("SUPABASE_SERVICE_KEY is not set - auth will not work");
}

export const supabaseAdmin = createClient(
  supabaseUrl || "",
  supabaseServiceKey || ""
);
