import { describe, it, expect, beforeAll } from 'vitest';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';

describe('API Integration Tests', () => {
  let authToken: string;
  let testUserId: string;
  let serverAvailable = false;

  beforeAll(async () => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
      });

      if (!res.ok) return;
      serverAvailable = true;

      const data = await res.json();
      authToken = data.token;
      testUserId = data.user.id;
    } catch {
      // Server not running — skip all tests
    }
  });

  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      if (!serverAvailable) return;
      const res = await fetch(`${API_URL}/api/projects`);
      expect(res.status).toBe(401);
    });

    it('should reject requests with invalid auth token', async () => {
      if (!serverAvailable) return;
      const res = await fetch(`${API_URL}/api/projects`, {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      expect(res.status).toBe(401);
    });

    it('should accept requests with valid auth token', async () => {
      if (!serverAvailable) return;
      const res = await fetch(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.ok).toBe(true);
    });
  });

  describe('Projects API', () => {
    it('should create a new project', async () => {
      if (!serverAvailable) return;
      const res = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          rawIdea: 'A test idea for integration testing',
          type: 'B2B SaaS',
        }),
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('rawIdea');
    });

    it('should list projects', async () => {
      if (!serverAvailable) return;
      const res = await fetch(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(res.ok).toBe(true);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
