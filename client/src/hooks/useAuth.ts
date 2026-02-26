import { useEffect, useState } from "react";
import { supabase, isDevMode } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

// Mock user for dev mode
const DEV_USER: User = {
  id: "dev-user-00000000-0000-0000-0000-000000000001",
  email: "dev@example.com",
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

export function useAuth() {
  const [user, setUser] = useState<User | null>(isDevMode ? DEV_USER : null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(!isDevMode);

  useEffect(() => {
    if (isDevMode) {
      // Dev mode: already set above
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (isDevMode) {
      console.log("[DEV MODE] Sign out - no-op");
      return;
    }
    await supabase.auth.signOut();
  };

  const getAccessToken = async (): Promise<string | null> => {
    if (isDevMode) {
      // Return a dev token that the server will accept
      return "dev_token_for_local_testing";
    }
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  return { user, session, isLoading, signOut, getAccessToken, isDevMode };
}
