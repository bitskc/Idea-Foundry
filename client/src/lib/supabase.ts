import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isDevMode = !supabaseUrl || !supabaseAnonKey;

let supabase: SupabaseClient;

if (isDevMode) {
    console.warn("[DEV MODE] Supabase credentials missing. Using mock auth.");
    // Create a mock client that won't crash but also won't work
    // The app will use the dev mode bypass on the server
    supabase = {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithOAuth: async () => ({ data: {}, error: new Error("Dev mode - use server directly") }),
            signOut: async () => ({ error: null }),
        },
    } as unknown as SupabaseClient;
} else {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
