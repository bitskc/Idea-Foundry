# AGENTS.md - Idea Foundry

## Commands
- **Dev server:** `npm run dev` (Express + Vite)
- **Build:** `npm run build`
- **Typecheck:** `npm run check`
- **Test all:** `npm run test`
- **Test single file:** `npx vitest run path/to/file.test.ts`
- **Test watch:** `npm run test:watch`
- **DB push:** `npm run db:push`

## Architecture
- **client/** - React 19 SPA with Vite, Tailwind v4, shadcn/ui (Radix), wouter routing
- **server/** - Express 5 API with Passport auth, AI integrations (OpenAI, Anthropic, Google)
- **server/mcp/** - MCP server for AI agent integration
- **shared/** - Drizzle ORM schema + Zod validation, shared types between client/server
- **Database:** PostgreSQL via Drizzle ORM + Supabase

## API Endpoints (Express 5)

### Authentication
- All endpoints except `/health` require Bearer token or Supabase session

### Ideas (Projects)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/projects | Required | List all ideas for user |
| GET | /api/projects/:id | Required | Get idea with conversation |
| GET | /api/projects/:id/export | Required | Export idea as structured JSON |
| GET | /api/projects/:id/export?format=prd | Required | Export PRD only |
| GET | /api/projects/:id/export?format=user-stories | Required | Export parsed user stories |
| POST | /api/projects | Required | Create new idea |
| PATCH | /api/projects/:id | Required | Update idea fields |
| DELETE | /api/projects/:id | Required | Delete idea |
| POST | /api/projects/:id/research | Required | Generate viability research |
| POST | /api/projects/:id/recommend-stack | Required | Get tech stack recommendation |
| POST | /api/projects/:id/generate-prd | Required | Generate PRD |
| POST | /api/projects/:id/export-github | Required | Export user stories to GitHub Issues |

### API Tokens (US-008)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/tokens | Required | List user's API tokens |
| POST | /api/tokens | Required | Create new API token |
| DELETE | /api/tokens/:id | Required | Revoke token |

### MCP (Model Context Protocol)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/mcp | API Token | Execute MCP tool or get capabilities |

### Conversations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/conversations/:id | Required | Get conversation with messages |
| POST | /api/conversations/:id/messages | Required | Send message and get AI response |

### Notes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/projects/:id/notes | Required | List notes for idea |
| POST | /api/projects/:id/notes | Required | Create note |
| DELETE | /api/notes/:id | Required | Delete note |

## Database Schema

### users
- `id` (UUID, PK) - Supabase auth user ID
- `email` (text, unique)
- `username` (text)
- `subscriptionStatus` (text) - 'free' or 'pro'
- `stripeCustomerId` (text)
- `stripeSubscriptionId` (text)

### projects (Ideas)
- `id` (serial, PK)
- `userId` (UUID, FK → users)
- `title`, `description`, `rawIdea` (text)
- `type` (text) - B2B SaaS, B2C Mobile App, etc.
- `status` (text) - draft, in_progress, completed
- `ideaStatus` (text) - exploring, active, backburner, archived
- `prdContent` (text) - Generated PRD markdown
- `notes` (text) - User notes
- `githubRepoUrl` (text) - Optional GitHub repo link
- `viabilityScore`, `viabilityBreakdown`, `competitors`, `keyInsights` (jsonb)
- `targetAvatar`, `techStack`, `techStackRecommendation` (jsonb)
- `createdAt`, `updatedAt` (timestamp)

### conversations
- `id` (serial, PK)
- `projectId` (int, FK → projects)
- `currentSection` (text) - Conversation topic
- `currentStep` (int) - Progress through questions
- `answers` (jsonb) - Collected answers
- `createdAt`, `updatedAt` (timestamp)

### messages
- `id` (serial, PK)
- `conversationId` (int, FK → conversations)
- `role` (text) - 'user' or 'ai'
- `content` (text) - Message body
- `createdAt` (timestamp)

### notes
- `id` (serial, PK)
- `projectId` (int, FK → projects)
- `content` (text)
- `createdAt` (timestamp)

### api_tokens (US-008)
- `id` (serial, PK)
- `userId` (UUID, FK → users)
- `tokenHash` (text) - SHA-256 hash of token
- `name` (text) - User-friendly name (e.g., "Cursor MCP")
- `lastUsedAt` (timestamp)
- `createdAt` (timestamp)
- `expiresAt` (timestamp, optional)

## MCP Tools (US-001, US-003)

> **Note:** Use an API token (from `POST /api/tokens`), not your Supabase session token.
> Token format: `if_sk_...` (64+ chars)

### idea_foundry_list_ideas
List all ideas for authenticated user.
```bash
POST /api/mcp
Authorization: Bearer if_sk_your_api_token_here
Content-Type: application/json

{
  "tool": "idea_foundry_list_ideas"
}
```

### idea_foundry_get_idea
Get full idea context with PRD, notes, viability.
```bash
POST /api/mcp
Authorization: Bearer if_sk_your_api_token_here
Content-Type: application/json

{
  "tool": "idea_foundry_get_idea",
  "params": { "ideaId": 123 }
}
```

### idea_foundry_get_prd
Get just the PRD content.
```bash
POST /api/mcp
Authorization: Bearer if_sk_your_api_token_here
Content-Type: application/json

{
  "tool": "idea_foundry_get_prd",
  "params": { "ideaId": 123 }
}
```

### idea_foundry_update_idea_notes
Add agent insights to idea notes.
```bash
POST /api/mcp
Authorization: Bearer if_sk_your_api_token_here
Content-Type: application/json

{
  "tool": "idea_foundry_update_idea_notes",
  "params": { "ideaId": 123, "notes": "Agent insight text" }
}
```

### idea_foundry_export_idea
Export idea as structured JSON with full context.
```bash
POST /api/mcp
Authorization: Bearer if_sk_your_api_token_here
Content-Type: application/json

{
  "tool": "idea_foundry_export_idea",
  "params": { "ideaId": 123, "format": "full" }
}
```
**Format options:** `full` (default), `prd`, `user-stories`

## Error Responses

All API endpoints return errors as JSON:
```json
{ "error": "Error message description" }
```

### Common HTTP Status Codes
| Code | Meaning | When |
|------|---------|------|
| 400 | Bad Request | Missing/invalid parameters |
| 401 | Unauthorized | Missing/invalid token |
| 404 | Not Found | Resource doesn't exist or not owned by user |
| 429 | Rate Limited | Exceeded 100 requests/minute |
| 500 | Server Error | Internal error (check logs) |

### MCP Tool Error Responses
MCP tools return errors in the response body:
```json
{ "error": "Idea not found" }
{ "error": "Access denied" }
{ "error": "ideaId parameter required" }
{ "error": "ideaId must be a valid number" }
```

## Code Style
- ESM modules (`"type": "module"`)
- Path aliases: `@/*` → client/src, `@shared/*` → shared, `@assets/*` → attached_assets
- Use Zod for validation, drizzle-zod for schema types
- React Query for data fetching, react-hook-form for forms
- Prefer Radix primitives via shadcn components in `client/src/components/ui/`
- Strict TypeScript; avoid `any`
- Import style: node_modules first, then @shared, then @/*, then relative paths
- Error handling: use Zod validation errors, React Query error boundaries, try/catch for async operations

## Quick Start for Agents

1. **Create API Token:** (requires authenticated session)
   ```bash
   POST /api/tokens
   Authorization: Bearer {supabase_session_token}
   Content-Type: application/json
   
   { "name": "My Agent" }
   ```
   Response: `{ "id": 1, "name": "My Agent", "token": "if_sk_abc123...", "createdAt": "..." }`
   
2. **Save Token:** Store the `token` value securely - it's only shown once!

3. **Use MCP:** Send tool requests with your API token:
   ```bash
   POST /api/mcp
   Authorization: Bearer if_sk_abc123...
   Content-Type: application/json
   
   { "tool": "idea_foundry_list_ideas" }
   ```

4. **Parse Response:** Check for `error` field, otherwise use the returned data
