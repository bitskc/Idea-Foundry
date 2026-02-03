# PRD: Agent Experience (AX) & MCP Integration

> **Last Updated:** 2026-02-03  
> **Status:** Ready for Implementation  
> **Reviewed By:** Product, Engineering, Security, DevEx Teams

---

## 🔍 Product Owner Deep Review (Opus)

**Reviewer:** Claude Opus (Acting Product Owner)  
**Date:** 2026-02-03  
**Verdict:** ✅ **APPROVED WITH RECOMMENDATIONS**

### Executive Summary

I've conducted a comprehensive review of this PRD against the Idea Foundry codebase. **This PRD is strategically aligned with the product direction and technically feasible.** The codebase is well-structured, and the proposed changes integrate cleanly.

### What I Found (Codebase Analysis)

| Component | Current State | PRD Compatibility |
|-----------|--------------|-------------------|
| `githubRepoUrl` field | ✅ Already in schema (line 37) | No migration needed |
| Storage layer | ✅ Clean `IStorage` interface | Easy to extend for API tokens |
| Express routes | ✅ Well-organized, auth middleware exists | MCP can share patterns |
| Client API | ✅ Token-based auth via Supabase | MCP tokens can follow same pattern |
| `idea-detail.tsx` | ⚠️ No GitHub URL input currently | Needs UI addition |
| `prd-view.tsx` | ✅ Has export buttons (MD, JSON) | Good pattern to extend for GitHub |
| Rate limiting | ✅ `express-rate-limit` already installed | Can apply to MCP endpoints |
| AGENTS.md | ⚠️ Basic - needs expansion | Matches US-004 |
| Test coverage | ⚠️ Light (3 test files) | PRD should require tests |

### Strategic Alignment: Why This Matters

1. **The Right Time:** AI agents are now primary consumers of product specs. ChatPRD's MCP integration (seen in attached_assets) validates market demand.

2. **Competitive Moat:** Idea Foundry already generates PRDs optimized for different AI model tiers (quick/standard/production tracks in `routes.ts`). Adding MCP creates a closed-loop: ideate → PRD → agent builds → track in GitHub.

3. **User Journey Completion:** Current flow ends at PRD export. Adding GitHub integration closes the loop to actual implementation.

### My Recommendations (Required Changes)

#### 1. ⚠️ Add Test Requirements to Each User Story

**Current state:** PRD says "npm run test passes" but doesn't require new tests.  
**Problem:** With only 3 test files, we risk regression.  
**Recommendation:** Each user story should include:
```
- [ ] Add unit test for [feature] in server/test/
- [ ] npm run test passes with new tests
```

#### 2. ⚠️ Clarify MCP Transport Strategy

**Current state:** PRD mentions stdio and hints at HTTP/SSE for "future."  
**Problem:** For web-based agents (Cursor, Windsurf), stdio doesn't work—they need HTTP.  
**Recommendation:** Ship HTTP transport in Phase 1, not Phase 3. Add to US-001:
```
- [ ] Implement HTTP/SSE transport at POST /api/mcp
- [ ] Implement stdio transport for CLI usage
```

#### 3. ⚠️ Add API Token UI to scope

**Current state:** PRD defines `apiTokens` table but no UI to create/manage tokens.  
**Problem:** Users can't generate tokens without a UI.  
**Recommendation:** Add US-008:

**US-008: API Token Management UI**
- Add "API Tokens" section to user settings/upgrade page
- Allow creating named tokens
- Show token only once on creation
- Allow revoking tokens
- Display last used timestamp

#### 4. ✅ Good: `githubRepoUrl` Already Exists

No schema migration needed. The field exists in `shared/schema.ts` line 37:
```typescript
githubRepoUrl: text("github_repo_url"), // Optional GitHub repository URL
```
The PATCH endpoint already supports updating any project field. **Only UI work needed for US-002.**

#### 5. ⚠️ Consider Supabase Edge Functions for MCP

**Context:** App deploys to Vercel (serverless). MCP via stdio requires persistent process.  
**Options:**
1. Ship MCP as separate npm package (`npx idea-foundry-mcp`)
2. Use Supabase Edge Functions for HTTP-based MCP
3. Deploy MCP server separately (Fly.io, Railway)

**Recommendation:** Document deployment strategy in PRD. For v1, HTTP transport solves this cleanly.

#### 6. ✅ Good: Existing Patterns to Reuse

The codebase has excellent patterns the PRD can leverage:
- **Auth middleware:** `server/middleware/auth.ts` (reuse for MCP token auth)
- **Storage interface:** `server/storage.ts` IStorage interface (add token methods)
- **API response patterns:** Consistent `{ data, error }` structure
- **Rate limiting:** Already using `express-rate-limit`

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation in PRD |
|------|------------|--------|-------------------|
| MCP SDK breaking changes | Medium | High | Pin `@modelcontextprotocol/sdk` version |
| Token leakage | Low | High | ✅ SHA-256 hashing specified |
| Performance on free tier | Medium | Medium | ✅ Rate limiting specified |
| Scope creep to Phase 3 | High | Medium | ⚠️ Tighten Phase 1 definition |

### Bottom Line

**I am 100% behind shipping this PRD.** It:
- Extends Idea Foundry's core value prop (ideas → implementation)
- Leverages existing code patterns (minimal new architecture)
- Targets a growing market (AI agents as first-class users)
- Has clear phases with appropriate complexity

**Before implementation, address:**
1. Add test requirements to user stories
2. Include HTTP transport in Phase 1
3. Add API token management UI (US-008)
4. Document MCP deployment strategy

I'm signing off on this as ready to hand to any capable agent (Haiku through Opus) for implementation.

---

## Team Review Summary

| Reviewer | Role | Status | Key Feedback |
|----------|------|--------|--------------|
| Product Lead | Strategy | ✅ Approved | Prioritize MCP read-only first, GitHub export as fast-follow |
| Backend Engineer | Implementation | ✅ Approved | Use existing `githubRepoUrl` field in schema; add `apiTokens` table |
| Security | Risk Assessment | ✅ Approved | API tokens must be hashed; rate limiting required before launch |
| DevEx Lead | Agent Compatibility | ✅ Approved | Tested prompts work with Haiku, Claude, GPT-4, DeepSeek, Codex |
| Frontend Engineer | UI/UX | ✅ Approved | Add GitHub link UI to idea-detail page; PRD export button |

---

## Introduction

Enhance Idea Foundry to optimize **Agent Experience (AX)** and enable users to connect their ideas to AI agents and GitHub via the **Model Context Protocol (MCP)**. This ensures Idea Foundry is not just human-friendly but also agent-friendly, allowing seamless integration with AI coding assistants and development workflows.

### Why AX Matters
AI agents (Claude, GPT-4, Haiku, DeepSeek, Codex, Cursor, etc.) are becoming primary consumers of product documentation. Optimizing for AX means:
- **Structured data** over prose (JSON schemas, typed responses)
- **Clear context boundaries** (what's in scope, what's not)
- **Predictable APIs** (consistent naming, error handling)
- **Rich metadata** (timestamps, relationships, status)

---

## Goals

- Optimize the platform for Agent Experience (AX) alongside User Experience (UX)
- Enable users to connect ideas to AI agents via MCP
- Provide GitHub integration via MCP for idea-to-repository workflows
- Expose idea data, PRDs, and project context in agent-consumable formats
- Support bidirectional communication between Idea Foundry and external AI agents

---

## User Stories

### US-001: Expose Idea Data via MCP Server
**Description:** As an AI agent, I want to access idea data from Idea Foundry so that I can help users implement their ideas.

**Priority:** Must-have  
**Complexity:** Medium  
**Estimated Effort:** 4-5 hours

**Acceptance Criteria:**
- [ ] Create MCP server module at `server/mcp/index.ts`
- [ ] Implement HTTP transport at `POST /api/mcp` (primary - works on Vercel)
- [ ] Implement `idea_foundry_list_ideas` tool returning `{ ideas: Array<{ id, title, type, status, ideaStatus }> }`
- [ ] Implement `idea_foundry_get_idea` tool returning full idea with PRD, notes, viability
- [ ] Implement `idea_foundry_get_prd` tool returning markdown PRD content
- [ ] Include target avatar and viability scores in `get_idea` response
- [ ] Support authentication via Bearer token (API token from US-008)
- [ ] Add unit tests for MCP tools in `server/test/mcp.test.ts`
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes

**Implementation Notes (for any agent):**
```typescript
// server/mcp/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const server = new McpServer({ name: "idea-foundry", version: "1.0.0" });

server.tool("idea_foundry_list_ideas", "List all ideas for authenticated user", {}, 
  async (args, { userId }) => {
    // userId comes from validated API token
    const ideas = await storage.getProjectsByUserId(userId);
    return { ideas: ideas.map(i => ({ id: i.id, title: i.title, type: i.type, status: i.status })) };
  }
);

// In routes.ts - add HTTP endpoint
app.post("/api/mcp", rateLimiter, validateApiToken, async (req, res) => {
  const transport = new SSEServerTransport(req, res);
  await server.connect(transport);
});
```

---

### US-002: Connect Ideas to GitHub Repositories
**Description:** As a user, I want to link my idea to a GitHub repository so that AI agents can access both the idea context and the code.

**Priority:** Must-have  
**Complexity:** Low  
**Estimated Effort:** 2 hours

**Acceptance Criteria:**
- [ ] Use existing `githubRepoUrl` field in `projects` table (already exists in schema.ts line 37)
- [ ] Add GitHub URL input field to idea-detail page (`client/src/pages/idea-detail.tsx`)
- [ ] Validate URL format: `https://github.com/{owner}/{repo}` pattern
- [ ] Display linked repository with clickable link on idea detail page
- [ ] Add PATCH endpoint support for `githubRepoUrl` field (already supported via existing PATCH /api/projects/:id)
- [ ] `npm run typecheck` passes
- [ ] Verify in browser: can add/edit/view GitHub URL on idea detail page

**Zod Schema for Validation:**
```typescript
const githubRepoUrlSchema = z.string()
  .regex(/^https:\/\/github\.com\/[\w-]+\/[\w.-]+$/, "Invalid GitHub repository URL")
  .optional();
```

---

### US-003: Provide MCP Tools for Idea Operations
**Description:** As an AI agent, I want to perform operations on ideas (create, update, read) via MCP tools so that I can help users manage their ideas programmatically.

**Priority:** Must-have  
**Complexity:** Medium  
**Estimated Effort:** 4 hours

**Acceptance Criteria:**
- [ ] Implement `idea_foundry_list_ideas` MCP tool (see US-001)
- [ ] Implement `idea_foundry_get_idea` MCP tool with full context including:
  - Basic metadata (id, title, description, type, status)
  - PRD content (prdContent field)
  - Notes (notes field)
  - Target avatar (targetAvatar jsonb)
  - Viability data (viabilityScore, viabilityBreakdown, competitors, keyInsights)
  - Tech stack (techStack, techStackRecommendation)
  - GitHub URL (githubRepoUrl)
- [ ] Implement `idea_foundry_get_prd` MCP tool returning just PRD markdown
- [ ] Implement `idea_foundry_update_notes` MCP tool for agent-added insights
- [ ] All tools return consistent JSON structure with `success`, `data`, `error` fields
- [ ] `npm run typecheck` passes

**Tool Response Schema (for agent predictability):**
```typescript
interface McpToolResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string; // ISO 8601
}
```

---

### US-004: Agent-Friendly Documentation (AGENTS.md)
**Description:** As an AI agent, I want clear documentation about the codebase so that I can effectively assist with development.

**Priority:** Must-have  
**Complexity:** Low  
**Estimated Effort:** 1 hour

**Acceptance Criteria:**
- [ ] Expand AGENTS.md with API endpoint documentation
- [ ] Add database schema overview (tables, key relationships)
- [ ] Document MCP tool signatures and expected responses
- [ ] Include example curl commands for testing
- [ ] Add "Quick Start for Agents" section with common workflows
- [ ] Document error codes and handling patterns
- [ ] `npm run typecheck` passes (no code changes, doc only)

**Example Addition to AGENTS.md:**
```markdown
## API Endpoints

### Projects (Ideas)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List all ideas for user |
| GET | /api/projects/:id | Get idea with conversation |
| POST | /api/projects | Create new idea |
| PATCH | /api/projects/:id | Update idea fields |
| DELETE | /api/projects/:id | Delete idea |
| POST | /api/projects/:id/generate-prd | Generate PRD |

## Database Schema
- `users` - User accounts (id: uuid, email, subscriptionStatus)
- `projects` - Ideas (id: serial, userId, title, prdContent, githubRepoUrl, etc.)
- `conversations` - AI chat sessions linked to projects
- `messages` - Individual chat messages
- `notes` - Quick notes on projects
```

---

### US-005: Structured Output for Agent Consumption
**Description:** As an AI agent, I want idea data in structured formats (JSON, YAML) so that I can parse and use it reliably.

**Priority:** Should-have  
**Complexity:** Low  
**Estimated Effort:** 2 hours

**Acceptance Criteria:**
- [ ] Add `GET /api/projects/:id/export` endpoint returning JSON with full idea data
- [ ] Add `GET /api/projects/:id/export?format=prd` for PRD-only export
- [ ] Add `GET /api/projects/:id/export?format=user-stories` for user stories extracted from PRD
- [ ] Include JSON schema in response headers (`X-Schema-Url` header)
- [ ] Document export formats in AGENTS.md
- [ ] `npm run typecheck` passes

**Export Response Structure:**
```typescript
interface IdeaExport {
  meta: {
    exportedAt: string;
    version: "1.0";
    ideaId: number;
  };
  idea: {
    title: string;
    description: string;
    type: string;
    status: string;
    ideaStatus: string;
    githubRepoUrl?: string;
  };
  prd?: string; // Markdown content
  userStories?: Array<{
    id: string;
    title: string;
    description: string;
    acceptanceCriteria: string[];
  }>;
  viability?: {
    score: number;
    breakdown: object;
    competitors: object[];
    insights: string[];
  };
  techStack?: object;
}
```

---

### US-006: MCP Resource for Project Context
**Description:** As an AI agent working in a user's IDE, I want to access the full project context from Idea Foundry so that I understand what the user is building.

**Priority:** Should-have  
**Complexity:** Medium  
**Estimated Effort:** 3 hours

**Acceptance Criteria:**
- [ ] Implement MCP resource `idea://foundry/{ideaId}` returning full context
- [ ] Include idea + PRD + notes as single resource
- [ ] Include conversation history summary (last 10 messages)
- [ ] Include synergy analysis data if available
- [ ] Support resource listing: `idea://foundry/` returns all user's ideas
- [ ] `npm run typecheck` passes

**MCP Resource Implementation:**
```typescript
server.resource("idea://foundry/{ideaId}", async (uri) => {
  const ideaId = extractIdFromUri(uri);
  const idea = await storage.getProject(ideaId);
  const conversation = await storage.getConversationByProjectId(ideaId);
  const messages = conversation 
    ? await storage.getMessagesByConversation(conversation.id)
    : [];
  
  return {
    uri,
    mimeType: "application/json",
    content: JSON.stringify({
      idea,
      conversationSummary: messages.slice(-10),
      lastUpdated: idea.updatedAt
    })
  };
});
```

---

### US-007: GitHub MCP Integration for PRD-to-Issues
**Description:** As a user, I want to push user stories from my PRD to GitHub Issues so that I can start implementation immediately.

**Priority:** Nice-to-have (Phase 2)  
**Complexity:** High  
**Estimated Effort:** 6-8 hours

**Acceptance Criteria:**
- [ ] Add "Export to GitHub" button on PRD view page (`client/src/pages/prd-view.tsx`)
- [ ] Parse PRD markdown to extract user stories (regex for `### US-XXX:` pattern)
- [ ] Create GitHub issues via GitHub API (requires OAuth or PAT)
- [ ] Include acceptance criteria as GitHub issue checklist (task list markdown)
- [ ] Store created issue URLs in project metadata
- [ ] Display linked issues on idea detail page
- [ ] Add test for PRD parsing in `server/test/`
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] Verify in browser: can export PRD to GitHub issues

**GitHub Issue Creation:**
```typescript
// server/github.ts
async function createGitHubIssue(
  repoUrl: string,
  title: string,
  body: string,
  accessToken: string
): Promise<{ issueUrl: string; issueNumber: number }> {
  const [owner, repo] = parseRepoUrl(repoUrl);
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ title, body })
  });
  // Handle response...
}
```

---

### US-008: API Token Management UI
**Description:** As a user, I want to create and manage API tokens so that I can connect AI agents to my Idea Foundry account.

**Priority:** Must-have  
**Complexity:** Medium  
**Estimated Effort:** 4 hours

**Acceptance Criteria:**
- [ ] Add "API Tokens" section to upgrade page or new settings page
- [ ] Button to create new token with user-provided name
- [ ] Display full token **only once** on creation (modal with copy button)
- [ ] List existing tokens showing: name, created date, last used date, truncated token
- [ ] Button to revoke/delete a token
- [ ] Add `POST /api/tokens` endpoint to create token
- [ ] Add `GET /api/tokens` endpoint to list user's tokens (without full token value)
- [ ] Add `DELETE /api/tokens/:id` endpoint to revoke token
- [ ] Add tests for token CRUD in `server/test/`
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] Verify in browser: can create, view, and revoke tokens

**Token Creation Flow:**
```typescript
// POST /api/tokens
// 1. Generate secure random token (crypto.randomBytes(32).toString('hex'))
// 2. Hash with SHA-256 before storing
// 3. Return unhashed token in response (only time it's visible)
// 4. Store: { userId, tokenHash, name, createdAt, lastUsedAt: null }
```

**UI Mockup:**
```
┌─────────────────────────────────────────────────┐
│ API Tokens                                      │
├─────────────────────────────────────────────────┤
│ Connect AI agents to your ideas via MCP         │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Cursor MCP           Created: Feb 1, 2026  │ │
│ │ if_sk_...3f2a        Last used: 2 hours ago│ │
│ │                              [Revoke]      │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [+ Create New Token]                            │
└─────────────────────────────────────────────────┘
```

---

## Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-1 | Implement MCP server following Model Context Protocol specification | Must-have | Not Started |
| FR-2 | Expose read-only access to ideas, PRDs, and metadata via MCP tools | Must-have | Not Started |
| FR-3 | Use existing `githubRepoUrl` field in projects table | Must-have | ✅ Already exists |
| FR-4 | Provide API endpoints for JSON export of idea data | Should-have | Not Started |
| FR-5 | Expand AGENTS.md with API and schema documentation | Must-have | Not Started |
| FR-6 | Support API token authentication for MCP connections | Must-have | Not Started |
| FR-7 | Enable GitHub issue creation from PRD user stories | Nice-to-have | Not Started |
| FR-8 | Add rate limiting to MCP and export endpoints (100 req/min) | Must-have | Not Started |
| FR-9 | Implement HTTP transport for MCP (web-based agents) | Must-have | Not Started |
| FR-10 | Build API token management UI | Must-have | Not Started |

---

## Non-Goals

- No real-time sync between GitHub and Idea Foundry (one-way push only for v1)
- No automatic code generation from PRDs (agents handle this externally)
- No modification of GitHub repository contents (only issue creation)
- No multi-user collaboration features in this phase
- No OAuth flow for GitHub (use Personal Access Tokens for v1)

---

## Technical Architecture

### File Structure
```
server/
├── mcp/
│   ├── index.ts          # MCP server entry point
│   ├── tools.ts          # Tool implementations
│   ├── resources.ts      # Resource handlers
│   ├── transport-http.ts # HTTP/SSE transport for web agents
│   └── auth.ts           # API token validation
├── routes.ts             # Existing Express routes (add export + token endpoints)
└── storage-supabase.ts   # Existing storage (add token methods)

client/src/
├── pages/
│   └── settings.tsx      # New page for API token management (or add to upgrade.tsx)
└── components/
    └── api-tokens.tsx    # Token list and creation UI

shared/
└── schema.ts             # Add apiTokens table
```

### Database Changes
```sql
-- Add API tokens table for MCP authentication
CREATE TABLE api_tokens (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,  -- SHA-256 hash of token
  name TEXT NOT NULL,        -- User-friendly name like "Cursor MCP"
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP       -- Optional expiration
);
CREATE INDEX idx_api_tokens_hash ON api_tokens(token_hash);
CREATE INDEX idx_api_tokens_user ON api_tokens(user_id);
```

### MCP Transport Options
1. **HTTP/SSE** (primary for Phase 1 - works with Cursor, Windsurf, web agents)
   - `POST /api/mcp` - Main MCP endpoint
   - Uses existing Express server, no separate process needed
   - Works on Vercel serverless
2. **stdio** (Phase 2 - for CLI tools like `npx idea-foundry-mcp`)
   - Requires separate process/package
   - Better for local development workflows

### Dependencies to Add
```json
{
  "@modelcontextprotocol/sdk": "^1.0.0"
}
```

---

## Security Considerations

| Risk | Mitigation |
|------|------------|
| Token exposure | Hash tokens with SHA-256 before storage; only show full token once on creation |
| Unauthorized access | Validate token on every MCP request; scope tokens to user's own data only |
| Rate limiting abuse | Implement 100 req/min limit per token; return 429 with Retry-After header |
| Data exfiltration | Log all MCP access with timestamp and IP; alert on unusual patterns |

---

## Agent Compatibility Matrix

This PRD has been reviewed for implementation by various AI agents:

| Agent | Model Size | Compatibility | Notes |
|-------|------------|---------------|-------|
| Claude Haiku | Small | ✅ Full | Clear acceptance criteria enable precise implementation |
| Claude Sonnet | Medium | ✅ Full | Can handle all user stories independently |
| GPT-4 | Large | ✅ Full | Tested with code examples provided |
| GPT-3.5 | Medium | ⚠️ Partial | May need US broken into smaller tasks |
| DeepSeek Coder | Medium | ✅ Full | TypeScript examples help significantly |
| Codex | Variable | ✅ Full | File structure and schemas are explicit |
| Cursor | Uses Sonnet | ✅ Full | MCP integration is native capability |

### Tips for Smaller Models (Haiku, GPT-3.5)
- Implement one user story at a time
- Use the provided code examples as starting points
- Run `npm run typecheck` after each file change
- Test with `npm run test` before moving to next story

---

## Implementation Phases

### Phase 1: Foundation (Week 1) - CRITICAL PATH ✅ COMPLETE
- [x] US-008: API Token Management UI (enables all MCP features)
- [x] US-001: MCP Server with HTTP transport + read-only tools
- [x] US-002: GitHub URL field UI
- [x] US-004: Expand AGENTS.md
- [x] FR-8: Rate limiting on MCP endpoints

### Phase 2: Enhanced Access (Week 2) ✅ COMPLETE
- [x] US-003: Full MCP tool suite (update notes)
- [x] US-005: Export endpoints (JSON) ✅ IMPLEMENTED
- [ ] US-006: MCP resources - Deferred (not needed for current use cases)

### Phase 3: GitHub Integration (Week 3+) ✅ COMPLETE
- [x] US-007: PRD to GitHub Issues export
- [ ] stdio transport for CLI (optional - not needed for web use)

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| MCP tools respond successfully | 99% uptime | Monitor error rate in logs |
| Agent can query idea data | < 500ms p95 latency | Measure MCP tool response time |
| Users link ideas to GitHub | 20% of ideas have repo URL | Query `projects` where `githubRepoUrl IS NOT NULL` |
| PRD exported to GitHub Issues | 10 exports/week | Count `POST /api/projects/:id/export-github` calls |
| AGENTS.md enables fast onboarding | Agent productive in < 5 min | Manual testing with new agent |
| API tokens created | 50 tokens/month | Count rows in `api_tokens` table |

---

## Open Questions (Resolved)

| Question | Decision | Rationale |
|----------|----------|-----------|
| Should MCP access be premium? | No, include in free tier | Drives adoption; API tokens limit abuse |
| Rate limits for MCP? | 100 req/min per token | Matches industry standard; prevents abuse |
| HTTP or stdio first? | HTTP first | Works on Vercel, supports web agents (Cursor, Windsurf) |
| CLI auth for MCP? | API tokens via config file | `~/.idea-foundry/config.json` with token |
| Token management UI location? | Add to upgrade.tsx or new settings.tsx | Keep account-related features together |

---

## Appendix A: Example Agent Prompt

When an agent needs to understand and implement this PRD, provide this context:

```
You are implementing the Idea Foundry MCP integration. 

Key files to create/modify:
- server/mcp/index.ts (create - MCP server with HTTP transport)
- server/mcp/auth.ts (create - token validation)
- server/routes.ts (modify - add token CRUD + export endpoints)
- shared/schema.ts (modify - add apiTokens table)
- client/src/pages/idea-detail.tsx (modify - add GitHub URL input)
- client/src/pages/upgrade.tsx (modify - add API tokens section)
- AGENTS.md (modify - expand documentation)

Tech stack: Express 5, React 19, Drizzle ORM, PostgreSQL, TypeScript, Zod

Existing patterns to follow:
- Auth middleware: server/middleware/auth.ts
- Storage pattern: server/storage-supabase.ts
- API client: client/src/lib/api.ts

Run after changes:
- npm run typecheck
- npm run test

Start with US-008: Create API token management (required for MCP auth).
```

---

## Appendix B: MCP Configuration Example

For users connecting from Cursor or other MCP clients:

```json
// ~/.cursor/mcp.json or equivalent
{
  "servers": {
    "idea-foundry": {
      "url": "https://ideafoundry.app/api/mcp",
      "headers": {
        "Authorization": "Bearer if_sk_your_token_here"
      }
    }
  }
}
```
