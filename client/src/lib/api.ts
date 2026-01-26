import { supabase } from "./supabase";

async function getAuthHeaders(): Promise<HeadersInit> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("[API] Error getting session:", error);
  }
  const token = data.session?.access_token;
  if (!token) {
    console.warn("[API] No auth token available - user may not be logged in");
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export type ApiError = {
  error: string;
  message?: string;
  upgradeUrl?: string;
};

export async function apiRequest<T = unknown>(
  method: string,
  url: string,
  data?: unknown
): Promise<T> {
  const headers: HeadersInit = {
    ...(await getAuthHeaders()),
    "Content-Type": "application/json",
  };

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  // Handle auth errors globally
  if (response.status === 401) {
    // Session expired - redirect to auth
    window.location.href = "/auth?expired=true";
    throw new Error("Session expired");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Request failed" }));
    const error = new Error(errorData.message || errorData.error || "Request failed") as Error & { status: number; data: ApiError };
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Convenience methods
export const api = {
  get: <T>(url: string) => apiRequest<T>("GET", url),
  post: <T>(url: string, data?: unknown) => apiRequest<T>("POST", url, data),
  patch: <T>(url: string, data?: unknown) => apiRequest<T>("PATCH", url, data),
  delete: <T>(url: string) => apiRequest<T>("DELETE", url),
};
