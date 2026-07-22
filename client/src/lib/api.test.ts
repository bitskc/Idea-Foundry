import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAuthHeaders, apiRequest, api } from "./api";

// Mock the JWT auth client
vi.mock("./supabase", () => ({
  getToken: vi.fn(),
  isDevMode: false,
}));

import { getToken } from "./supabase";

describe("api helper", () => {
  const mockFetch = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = mockFetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("getAuthHeaders", () => {
    it("returns Authorization header when token exists", async () => {
      vi.mocked(getToken).mockReturnValue("test-token-123");

      const headers = await getAuthHeaders();

      expect(headers).toEqual({ Authorization: "Bearer test-token-123" });
    });

    it("returns empty object when no token exists", async () => {
      vi.mocked(getToken).mockReturnValue(null);

      const headers = await getAuthHeaders();

      expect(headers).toEqual({});
    });
  });

  describe("apiRequest", () => {
    beforeEach(() => {
      vi.mocked(getToken).mockReturnValue("test-token-123");
    });

    it("makes GET request with auth header", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: "test" }),
      });

      const result = await apiRequest("GET", "/api/test");

      expect(mockFetch).toHaveBeenCalledWith("/api/test", {
        method: "GET",
        headers: { Authorization: "Bearer test-token-123", "Content-Type": "application/json" },
        body: undefined,
      });
      expect(result).toEqual({ data: "test" });
    });

    it("makes POST request with JSON body", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      await apiRequest("POST", "/api/test", { name: "test" });

      expect(mockFetch).toHaveBeenCalledWith("/api/test", {
        method: "POST",
        headers: { Authorization: "Bearer test-token-123", "Content-Type": "application/json" },
        body: JSON.stringify({ name: "test" }),
      });
    });

    it("handles 204 No Content response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.resolve({}),
      });

      const result = await apiRequest("DELETE", "/api/test/1");

      expect(result).toBeUndefined();
    });

    it("handles 401 by redirecting to auth page", async () => {
      const mockHref = { href: "" };
      vi.stubGlobal("window", { location: mockHref });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Unauthorized" }),
      });

      await expect(apiRequest("GET", "/api/test")).rejects.toThrow("Session expired");
      expect(mockHref.href).toBe("/auth?expired=true");

      vi.unstubAllGlobals();
    });

    it("throws error with status and data for non-OK responses", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Server error", message: "Something broke" }),
      });

      await expect(apiRequest("GET", "/api/test")).rejects.toMatchObject({
        message: "Something broke",
        status: 500,
      });
    });

    it("handles JSON parse failure in error response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      await expect(apiRequest("GET", "/api/test")).rejects.toMatchObject({
        message: "Request failed",
      });
    });

    it("uses error field when message is not present", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "Bad request" }),
      });

      await expect(apiRequest("GET", "/api/test")).rejects.toMatchObject({
        message: "Bad request",
      });
    });
  });

  describe("api convenience methods", () => {
    beforeEach(() => {
      vi.mocked(getToken).mockReturnValue("test-token-123");
    });

    it("api.get calls apiRequest with GET", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: "test" }),
      });

      await api.get("/api/test");

      expect(mockFetch).toHaveBeenCalledWith("/api/test", expect.objectContaining({ method: "GET" }));
    });

    it("api.post calls apiRequest with POST and data", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      await api.post("/api/test", { name: "test" });

      expect(mockFetch).toHaveBeenCalledWith("/api/test", expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "test" }),
      }));
    });

    it("api.patch calls apiRequest with PATCH and data", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      await api.patch("/api/test", { name: "updated" });

      expect(mockFetch).toHaveBeenCalledWith("/api/test", expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "updated" }),
      }));
    });

    it("api.delete calls apiRequest with DELETE", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        json: () => Promise.resolve({}),
      });

      await api.delete("/api/test/1");

      expect(mockFetch).toHaveBeenCalledWith("/api/test/1", expect.objectContaining({ method: "DELETE" }));
    });
  });
});
