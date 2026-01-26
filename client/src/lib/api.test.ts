import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAuthHeaders, apiRequest, api } from "./api";

// Mock supabase
vi.mock("./supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

// Import the mocked supabase to control it in tests
import { supabase } from "./supabase";

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
    it("returns Authorization header when session exists", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "test-token-123" } },
        error: null,
      } as any);

      const headers = await getAuthHeaders();

      expect(headers).toEqual({ Authorization: "Bearer test-token-123" });
    });

    it("returns empty object when no session exists", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as any);

      const headers = await getAuthHeaders();

      expect(headers).toEqual({});
    });

    it("returns empty object when access_token is undefined", async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: undefined } },
        error: null,
      } as any);

      const headers = await getAuthHeaders();

      expect(headers).toEqual({});
    });
  });

  describe("apiRequest", () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      } as any);
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
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
        body: undefined,
      });
      expect(result).toEqual({ data: "test" });
    });

    it("makes POST request with JSON body", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 1 }),
      });

      const result = await apiRequest("POST", "/api/items", { name: "test" });

      expect(mockFetch).toHaveBeenCalledWith("/api/items", {
        method: "POST",
        headers: {
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: "test" }),
      });
      expect(result).toEqual({ id: 1 });
    });

    it("handles 204 No Content response", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
      });

      const result = await apiRequest("DELETE", "/api/items/1");

      expect(result).toBeUndefined();
    });

    it("handles 401 by redirecting to auth page", async () => {
      // Mock window.location
      const mockLocation = { href: "" };
      Object.defineProperty(global, "window", {
        value: { location: mockLocation },
        writable: true,
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      await expect(apiRequest("GET", "/api/protected")).rejects.toThrow(
        "Session expired"
      );
      expect(mockLocation.href).toBe("/auth?expired=true");
    });

    it("throws error with status and data for non-OK responses", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({ error: "Bad Request", message: "Invalid input" }),
      });

      try {
        await apiRequest("POST", "/api/items", {});
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.message).toBe("Invalid input");
        expect(error.status).toBe(400);
        expect(error.data).toEqual({
          error: "Bad Request",
          message: "Invalid input",
        });
      }
    });

    it("handles JSON parse failure in error response", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      try {
        await apiRequest("GET", "/api/broken");
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.message).toBe("Request failed");
        expect(error.status).toBe(500);
      }
    });

    it("uses error field when message is not present", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Not found" }),
      });

      try {
        await apiRequest("GET", "/api/missing");
        expect.fail("Should have thrown");
      } catch (error: any) {
        expect(error.message).toBe("Not found");
      }
    });
  });

  describe("api convenience methods", () => {
    beforeEach(() => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "test-token" } },
        error: null,
      } as any);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });
    });

    it("api.get makes GET request", async () => {
      await api.get("/api/resource");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/resource",
        expect.objectContaining({ method: "GET" })
      );
    });

    it("api.post makes POST request with data", async () => {
      await api.post("/api/resource", { field: "value" });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/resource",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ field: "value" }),
        })
      );
    });

    it("api.patch makes PATCH request with data", async () => {
      await api.patch("/api/resource/1", { field: "updated" });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/resource/1",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ field: "updated" }),
        })
      );
    });

    it("api.delete makes DELETE request", async () => {
      await api.delete("/api/resource/1");

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/resource/1",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });
});
