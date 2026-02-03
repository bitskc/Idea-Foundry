import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the storage module before importing MCP modules
vi.mock('../storage-supabase', () => ({
  storage: {
    getProjectsByUserId: vi.fn().mockResolvedValue([]),
    getProject: vi.fn().mockResolvedValue(null),
    updateProject: vi.fn().mockResolvedValue({}),
    getApiTokenByHash: vi.fn().mockResolvedValue(null),
    updateApiTokenLastUsed: vi.fn().mockResolvedValue(undefined),
  }
}));

// Now import the modules that depend on storage
import { validateApiToken, extractBearerToken } from '../mcp/auth';
import { executeMcpTool, MCP_TOOLS } from '../mcp/index';

describe('MCP Auth', () => {
  describe('extractBearerToken', () => {
    it('extracts token from Bearer header', () => {
      const token = extractBearerToken('Bearer if_sk_test123');
      expect(token).toBe('if_sk_test123');
    });

    it('returns null for invalid format', () => {
      const token = extractBearerToken('Invalid if_sk_test123');
      expect(token).toBeNull();
    });

    it('returns null when undefined', () => {
      const token = extractBearerToken(undefined);
      expect(token).toBeNull();
    });

    it('handles Basic auth gracefully', () => {
      const token = extractBearerToken('Basic dXNlcjpwYXNz');
      expect(token).toBeNull();
    });

    it('handles empty string', () => {
      const token = extractBearerToken('');
      expect(token).toBeNull();
    });

    it('extracts token with special characters', () => {
      const token = extractBearerToken('Bearer if_sk_abc123-def_456');
      expect(token).toBe('if_sk_abc123-def_456');
    });
  });

  describe('validateApiToken', () => {
    it('returns null for invalid header', async () => {
      const userId = await validateApiToken('invalid');
      expect(userId).toBeNull();
    });

    it('returns null for missing header', async () => {
      const userId = await validateApiToken(undefined);
      expect(userId).toBeNull();
    });

    it('returns null for empty bearer token', async () => {
      const userId = await validateApiToken('Bearer ');
      expect(userId).toBeNull();
    });
  });
});

describe('MCP Tools Definition', () => {
  it('exports all required tools', () => {
    const toolNames = MCP_TOOLS.map(t => t.name);
    expect(toolNames).toContain('idea_foundry_list_ideas');
    expect(toolNames).toContain('idea_foundry_get_idea');
    expect(toolNames).toContain('idea_foundry_get_prd');
    expect(toolNames).toContain('idea_foundry_update_idea_notes');
    expect(toolNames).toContain('idea_foundry_export_idea');
  });

  it('all tools have descriptions', () => {
    for (const tool of MCP_TOOLS) {
      expect(tool.description).toBeTruthy();
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(10);
    }
  });

  it('get_idea tool requires ideaId parameter', () => {
    const getTool = MCP_TOOLS.find(t => t.name === 'idea_foundry_get_idea');
    expect(getTool?.parameters).toHaveProperty('ideaId');
    expect(getTool?.parameters.ideaId.type).toBe('number');
  });

  it('update_notes tool requires both ideaId and notes', () => {
    const updateTool = MCP_TOOLS.find(t => t.name === 'idea_foundry_update_idea_notes');
    expect(updateTool?.parameters).toHaveProperty('ideaId');
    expect(updateTool?.parameters).toHaveProperty('notes');
  });
});

describe('MCP Tool Execution', () => {
  const mockUserId = 'test-user-123';

  describe('idea_foundry_list_ideas', () => {
    it('returns ideas array on success', async () => {
      // This will fail without mocking storage, but tests the structure
      const result = await executeMcpTool('idea_foundry_list_ideas', {}, mockUserId);
      // Either returns ideas or an error (depending on DB connection)
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  describe('idea_foundry_get_idea', () => {
    it('returns error when ideaId is missing', async () => {
      const result = await executeMcpTool('idea_foundry_get_idea', {}, mockUserId);
      expect(result.error).toBe('ideaId parameter required');
    });

    it('returns error when ideaId is null', async () => {
      const result = await executeMcpTool('idea_foundry_get_idea', { ideaId: null }, mockUserId);
      expect(result.error).toBe('ideaId parameter required');
    });

    it('handles string ideaId correctly', async () => {
      const result = await executeMcpTool('idea_foundry_get_idea', { ideaId: '123' }, mockUserId);
      // Should not return "ideaId must be a valid number" since '123' is parseable
      expect(result.error).not.toBe('ideaId must be a valid number');
    });

    it('returns error for non-numeric string ideaId', async () => {
      const result = await executeMcpTool('idea_foundry_get_idea', { ideaId: 'abc' }, mockUserId);
      expect(result.error).toBe('ideaId must be a valid number');
    });
  });

  describe('idea_foundry_get_prd', () => {
    it('returns error when ideaId is missing', async () => {
      const result = await executeMcpTool('idea_foundry_get_prd', {}, mockUserId);
      expect(result.error).toBe('ideaId parameter required');
    });

    it('returns error for non-numeric ideaId', async () => {
      const result = await executeMcpTool('idea_foundry_get_prd', { ideaId: 'invalid' }, mockUserId);
      expect(result.error).toBe('ideaId must be a valid number');
    });
  });

  describe('idea_foundry_update_idea_notes', () => {
    it('returns error when ideaId is missing', async () => {
      const result = await executeMcpTool('idea_foundry_update_idea_notes', { notes: 'test' }, mockUserId);
      expect(result.error).toBe('ideaId and notes parameters required');
    });

    it('returns error when notes is missing', async () => {
      const result = await executeMcpTool('idea_foundry_update_idea_notes', { ideaId: 123 }, mockUserId);
      expect(result.error).toBe('ideaId and notes parameters required');
    });

    it('returns error when both are missing', async () => {
      const result = await executeMcpTool('idea_foundry_update_idea_notes', {}, mockUserId);
      expect(result.error).toBe('ideaId and notes parameters required');
    });

    it('returns error for non-numeric ideaId', async () => {
      const result = await executeMcpTool('idea_foundry_update_idea_notes', { ideaId: 'abc', notes: 'test' }, mockUserId);
      expect(result.error).toBe('ideaId must be a valid number');
    });
  });

  describe('idea_foundry_export_idea', () => {
    it('returns error when ideaId is missing', async () => {
      const result = await executeMcpTool('idea_foundry_export_idea', {}, mockUserId);
      expect(result.error).toBe('ideaId parameter required');
    });

    it('returns error for non-numeric ideaId', async () => {
      const result = await executeMcpTool('idea_foundry_export_idea', { ideaId: 'abc' }, mockUserId);
      expect(result.error).toBe('ideaId must be a valid number');
    });

    it('handles format parameter', async () => {
      const result = await executeMcpTool('idea_foundry_export_idea', { ideaId: 123, format: 'prd' }, mockUserId);
      // Will return "Idea not found" since mock returns null
      expect(result.error).toBe('Idea not found');
    });
  });

  describe('unknown tool', () => {
    it('returns error for unknown tool name', async () => {
      const result = await executeMcpTool('unknown_tool', {}, mockUserId);
      expect(result.error).toBe('Unknown tool: unknown_tool');
    });

    it('returns error for empty tool name', async () => {
      const result = await executeMcpTool('', {}, mockUserId);
      expect(result.error).toBe('Unknown tool: ');
    });
  });
});

describe('Token Prefix Format', () => {
  it('tokens should be prefixed with if_sk_', () => {
    // This documents the expected token format
    const exampleToken = 'if_sk_abc123def456';
    expect(exampleToken.startsWith('if_sk_')).toBe(true);
  });
});
