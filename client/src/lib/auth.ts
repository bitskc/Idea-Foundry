// JWT auth client — replaces Supabase client
// Token stored in localStorage, sent as Bearer header

const TOKEN_KEY = "if_auth_token";
const USER_KEY = "if_auth_user";

export interface AuthUser {
  id: string;
  email: string;
}

// Dev mode: no DATABASE_URL on server means mock auth is used
// Client detects dev mode by checking if we're on localhost without a real API
export const isDevMode =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
  !import.meta.env.VITE_API_URL;

const DEV_USER: AuthUser = {
  id: "dev-user-00000000-0000-0000-0000-000000000001",
  email: "dev@example.com",
};

export function getToken(): string | null {
  if (isDevMode) return "dev_token_for_local_testing";
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (isDevMode) return DEV_USER;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function register(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  setToken(data.token);
  setStoredUser(data.user);
  return data;
}

export function signOut(): void {
  clearToken();
}
