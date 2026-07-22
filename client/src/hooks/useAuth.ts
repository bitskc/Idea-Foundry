import { useEffect, useState, useCallback } from "react";
import {
  isDevMode,
  getToken,
  getStoredUser,
  signOut as signOutFn,
  type AuthUser,
} from "@/lib/supabase";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(isDevMode ? getStoredUser() : getStoredUser());
  const [isLoading] = useState(false);

  useEffect(() => {
    if (isDevMode) return;
    // Check if we have a token on mount
    const token = getToken();
    const storedUser = getStoredUser();
    if (token && storedUser) {
      setUser(storedUser);
    } else {
      setUser(null);
    }
  }, []);

  const signOut = useCallback(() => {
    signOutFn();
    setUser(null);
  }, []);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    return getToken();
  }, []);

  return { user, isLoading, signOut, getAccessToken, isDevMode };
}
