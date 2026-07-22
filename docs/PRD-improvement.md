# PRD: Idea Foundry Improvement Initiative

> **Status**: Approved for implementation  
> **Date**: 2026-07-22  
> **Owner**: Andy Hayes  
> **Goal**: Transform Idea Foundry from half-broken post-migration state to a top-notch, production-quality app

## Problem Statement

Idea Foundry was recently migrated from Supabase (auth + DB) to JWT auth + Drizzle/Postgres (Neon). The migration succeeded but left the app in a partially broken state:

1. **Core feature broken**: The AI conversation (the whole point of the app) doesn't display responses — client expects SSE streaming, server returns JSON
2. **5 dead UI features**: Voice input, TTS, landing page generator, community finder, reality check — all call non-existent endpoints
3. **Settings page doesn't exist**: Button has no handler, no route, no component
4. **BYOK advertised but not implemented**: Landing page promises "Use your own Claude API key" and "BYOK option"
5. **Stripe webhook broken on Vercel**: Auth middleware blocks it, no raw body handling
6. **Sign Out doesn't clear token**: Just navigates without clearing JWT
7. **7 unused dependencies**, 2 dead files, stale Supabase references throughout
8. **Security gaps**: JWT secret fallback, missing input validation, pricing inconsistency

## Target Users

- **Primary**: Solo founders and indie hackers who want to develop raw ideas into structured PRDs through AI-guided interviews
- **Secondary**: Makers who want BYOK to avoid per-seat AI costs

## Architecture Decisions

### AD-1: SSE Streaming for Conversation
**Decision**: Implement server-side SSE streaming (not switch client to JSON).  
**Rationale**: The client already has full SSE parsing logic. Streaming provides better UX (responses appear progressively). Both Gemini (`sendMessageStream`) and Anthropic (`messages.stream`) support streaming natively.  
**Implementation**: Add `generateTextStream()` to `AIService` interface. Route sets `text/event-stream` headers, streams chunks as `data: {"content":"..."}\n\n`, sends final `data: {"content":"...","done":true,"step":N,"section":"...","progress":N}\n\n`.

### AD-2: BYOK with Per-Request AI Service
**Decision**: Create AI service instances per-request when a user has BYOK keys, fall back to server defaults.  
**Rationale**: Global AI service singleton can't serve per-user keys. Per-request instantiation is cheap (SDK clients are lightweight). Avoids thread-safety issues.  
**Implementation**: `user_api_keys` table with AES-256-GCM encrypted keys. `getAIServiceForUser(userId, provider)` helper. Cache decrypted keys in-memory for 5 minutes with LRU.

### AD-3: Encryption with ENCRYPTION_KEY env var
**Decision**: AES-256-GCM with a single `ENCRYPTION_KEY` env var (32-byte hex string).  
**Rationale**: Industry standard, authenticated encryption, Node `crypto` built-in. No external dependency.  
**Fallback**: If `ENCRYPTION_KEY` not set in production, throw. In dev, derive from JWT_SECRET.

### AD-4: Consolidate Express Setup
**Decision**: Extract shared middleware (CORS, logging, raw body for Stripe, error handling) into `server/middleware/shared.ts`. Both `app.ts` and `vercel-entry.ts` import it.  
**Rationale**: Current duplication causes bugs (vercel.ts missing raw body handling, app.ts missing helmet). Single source of truth.

### AD-5: Rename supabase.ts → auth.ts
**Decision**: Rename `client/src/lib/supabase.ts` to `client/src/lib/auth.ts` and update all imports.  
**Rationale**: File is the JWT auth client but named after the dead dependency. Causes confusion. Clean rename via LSP.

### AD-6: Remove Dead UI Features (not implement)
**Decision**: Remove voice/TTS buttons and landing-page/communities/reality-check sections rather than implementing them.  
**Rationale**: These were never shipped. Implementing all 5 would be a separate project. Removing them gives a clean, honest UX. Can re-add individually later.

### AD-7: Password Reset — Remove for Now
**Decision**: Remove the "Forgot password?" option from the auth page.  
**Rationale**: No email service configured. Implementing email send would require a vendor (Resend, SendGrid) and domain verification. Better to remove than show a broken feature. Can add later with Resend.

### AD-8: Pricing — Standardize to $15/mo
**Decision**: Use $15/mo everywhere (landing page price). Update upgrade page from $19 to $15.  
**Rationale**: Landing page is the marketing source of truth. $15 is the advertised price.

### AD-9: Toast Consolidation — Keep Both
**Decision**: Keep both Radix toast and Sonner. Don't migrate.  
**Rationale**: Both work fine. Migrating would touch 8+ files for zero user-facing benefit. Not worth the risk.

### AD-10: Legacy Routes — Keep for Now
**Decision**: Keep legacy routes (`/dashboard`, `/idea/:id`, etc.) alongside `/app/*` routes.  
**Rationale**: External links and bookmarks may point to old paths. Removing them would break those. Low cost to maintain.

---

## User Stories

### US-001: SSE Conversation Streaming
**As a** founder using Idea Foundry,  
**I want** AI responses to stream in real-time during the interview,  
**So that** I can read the response as it's generated and feel the conversation is live.

**Acceptance Criteria**:
- Server sets `Content-Type: text/event-stream` on `/api/conversations/:id/messages`
- AI response chunks arrive as `data: {"content":"chunk"}\n\n` lines
- Final event includes `done: true`, `step`, `section`, `progress`
- Both Gemini and Anthropic adapters support streaming
- Client renders chunks progressively (already implemented)
- Non-streaming endpoints (research, PRD gen, etc.) still return JSON

### US-002: Stripe Webhook Processing
**As a** Stripe payment system,  
**I want** to send webhook events to Idea Foundry without auth,  
**So that** subscription lifecycle events (upgrade, cancel) are processed.

**Acceptance Criteria**:
- `/api/webhook/stripe` is registered BEFORE `app.use('/api', requireAuth)`
- Raw body is available for signature verification on both local and Vercel
- `checkout.session.completed` upgrades user to `pro`
- `customer.subscription.deleted` downgrades user to `free`
- Webhook responds with `{ received: true }` on success

### US-003: Settings Page
**As a** user,  
**I want** to access a settings page from the sidebar,  
**So that** I can manage my account, API keys, and billing.

**Acceptance Criteria**:
- Settings button in sidebar navigates to `/app/settings`
- Settings page has tabs: Profile, API Keys, Billing
- Profile tab shows email and change password form
- API Keys tab shows BYOK management (US-005)
- Billing tab shows subscription status and link to Stripe portal
- Page uses AppLayout for consistent navigation

### US-004: Remove Dead UI Features
**As a** user,  
**I want** all buttons in the UI to work,  
**So that** I don't click something and get a silent error.

**Acceptance Criteria**:
- Voice input (mic) button removed from conversation page
- Text-to-speech (speaker) button removed from conversation page
- "Generate Landing Page" section removed from PRD view
- "Find Communities" section removed from PRD view
- "Reality Check" section removed from PRD view
- No references to `/api/speech-to-text`, `/api/text-to-speech`, `/api/projects/:id/generate-landing-page`, `/api/projects/:id/find-communities`, `/api/projects/:id/reality-check` remain in client code

### US-005: BYOK (Bring Your Own Key)
**As a** power user,  
**I want** to use my own AI provider API keys,  
**So that** I can control my own usage and costs.

**Acceptance Criteria**:
- `user_api_keys` table stores encrypted keys per user per provider
- Settings → API Keys tab lets user add Gemini, Anthropic, or OpenAI keys
- Keys are encrypted at rest with AES-256-GCM
- When a user has a BYOK key for the active provider, that key is used instead of the server default
- Keys are masked in the UI (e.g., `AIza...x7f2`)
- User can delete a key at any time
- If BYOK key is invalid, server falls back to default key with a warning toast

### US-006: Dead Code Cleanup
**As a** developer,  
**I want** dead code and unused dependencies removed,  
**So that** the codebase is maintainable and builds are fast.

**Acceptance Criteria**:
- `client/src/pages/home.tsx` deleted
- `client/src/components/layout.tsx` deleted
- 7 unused npm dependencies removed from package.json
- `client/src/lib/supabase.ts` renamed to `client/src/lib/auth.ts` (all imports updated)
- `.env.example` updated (remove Supabase, add JWT_SECRET, ENCRYPTION_KEY, STRIPE_*)
- `server/test/mcp.test.ts` mock fixed (storage-supabase → storage)
- `shared/schema.ts` password comment updated
- `package.json` name changed to `idea-foundry`

### US-007: Consolidate Express Setup
**As a** developer,  
**I want** a single Express middleware configuration,  
**So that** local and Vercel environments behave identically.

**Acceptance Criteria**:
- Shared middleware extracted to `server/middleware/shared.ts`
- Both `app.ts` and `vercel-entry.ts` use the shared setup
- CORS, logging, raw body for Stripe, error handling are identical
- Helmet added to both (currently only in one)
- Rate limiter paths match actual route paths

### US-008: Fix Sign Out
**As a** user,  
**I want** signing out to clear my session,  
**So that** my account is secure on shared computers.

**Acceptance Criteria**:
- Sign Out button calls `signOut()` to clear localStorage token
- After clearing, navigates to `/auth`
- No stale token remains in localStorage

### US-009: Fix Health Check
**As a** monitoring system,  
**I want** the health endpoint to return 200 when the DB is reachable,  
**So that** I can track uptime accurately.

**Acceptance Criteria**:
- `/api/health` returns 200 with `{"status":"ok"}` when DB is reachable
- Returns 200 even if the test user doesn't exist (that's fine — DB is reachable)
- Returns 500 only on actual connection failure

### US-010: Update AI Models
**As a** user,  
**I want** the app to use current AI models,  
**So that** I get the best quality responses.

**Acceptance Criteria**:
- Gemini model configurable via `GEMINI_MODEL` env var (default: `gemini-2.0-flash`)
- Anthropic model configurable via `ANTHROPIC_MODEL` env var (default: `claude-sonnet-4-20250514`)
- No hardcoded model strings in adapter constructors

### US-011: Fix Pricing Consistency
**As a** user,  
**I want** consistent pricing across the app,  
**So that** I trust the product.

**Acceptance Criteria**:
- Landing page shows $15/mo (already correct)
- Upgrade page shows $15/mo (currently $19)
- Both pages reference the same Stripe price

### US-012: JWT Secret Hardening
**As a** security-conscious operator,  
**I want** the app to fail if JWT_SECRET is missing in production,  
**So that** tokens aren't signed with a known default key.

**Acceptance Criteria**:
- In production (`NODE_ENV=production`), missing `JWT_SECRET` throws on startup
- In dev, falls back to `dev-secret-change-in-production` with a warning
- No code path can sign tokens with a hardcoded secret in production

### US-013: Input Validation
**As a** API consumer,  
**I want** input validation on all mutation endpoints,  
**So that** invalid data doesn't corrupt the database.

**Acceptance Criteria**:
- `PATCH /api/projects/:id` validates body with Zod before passing to storage
- Only allowed fields (title, description, status, ideaStatus, progress) are accepted
- Invalid input returns 400 with field-level errors

### US-014: Remove Password Reset
**As a** user,  
**I want** the auth page to only show working features,  
**So that** I don't try to reset my password and get told it's not available.

**Acceptance Criteria**:
- "Forgot password?" link removed from auth page
- No reset mode in the auth form
- Auth page only shows login and signup modes

### US-015: Configurable AI Models
**As a** operator,  
**I want** to change AI models without code changes,  
**So that** I can upgrade to newer models quickly.

**Acceptance Criteria**:
- `GEMINI_MODEL` env var overrides default Gemini model
- `ANTHROPIC_MODEL` env var overrides default Anthropic model
- Defaults are current production models (not legacy versions)

### US-016: Shared Storage Selection
**As a** developer,  
**I want** storage selection logic in one place,  
**So that** adding a new storage backend doesn't require editing 3 files.

**Acceptance Criteria**:
- `getStorage()` function in `server/storage.ts` returns the right storage instance
- `routes.ts`, `mcp/index.ts`, `mcp/auth.ts` all use `getStorage()` instead of duplicating logic
- `isDevMode` check lives in one place

---

## Non-Goals

- Implementing voice input/TTS (removed, not implemented)
- Implementing landing page generator (removed)
- Implementing community finder (removed)
- Implementing reality check (removed)
- Email service / password reset (removed from UI, can add later with Resend)
- OpenAI adapter (type exists but no implementation — not adding one)
- Migrating toast systems (keeping both — works fine)
- Removing legacy routes (keeping for backward compatibility)
- Mobile app
- Real-time collaboration

## Technical Constraints

- Deployed on Vercel (serverless function, 30s max duration)
- Neon Postgres (free tier, 256MB)
- Node 22 (Vercel runtime)
- No new paid services (use existing infrastructure)
- All changes via direct push to main (idea-foundry convention)
- `npm run typecheck`, `npm test`, `npm run build` must pass before push

## Success Metrics

- All 51+ existing tests pass
- Typecheck clean
- Build passes
- Vercel deploy succeeds
- Conversation feature works end-to-end (streaming responses display)
- Settings page loads and BYOK keys can be saved/retrieved
- Stripe webhook processes without auth error
- No dead buttons in UI
- No unused dependencies
