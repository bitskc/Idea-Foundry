import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;

describe('API Integration Tests', () => {
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create test user or sign in
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
      throw signUpError;
    }

    // Sign in to get token
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      throw signInError;
    }

    authToken = signInData.session!.access_token;
    testUserId = signInData.user!.id;
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    if (testUserId) {
      console.log('Test user cleanup needed:', testUserId);
    }
  });

  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      const response = await fetch(`${API_URL}/api/projects`);
      expect(response.status).toBe(401);
    });

    it('should reject requests with invalid auth token', async () => {
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: {
          Authorization: 'Bearer invalid-token-12345',
        },
      });
      expect(response.status).toBe(401);
    });

    it('should accept requests with valid auth token', async () => {
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Projects API', () => {
    let projectId: string;

    it('should create a new project', async () => {
      const response = await fetch(`${API_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          title: 'Test Project',
          description: 'Test Description',
        }),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data.title).toBe('Test Project');
      projectId = data.id;
    });

    it('should list projects', async () => {
      const response = await fetch(`${API_URL}/api/projects`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });
  });
});
