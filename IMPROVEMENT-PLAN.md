# Idea Foundry — Improvement Plan

> Audit date: 2026-07-22 | Status: Post-Supabase migration, deployed but not usable

## Executive Summary

The app has a working foundation (auth, DB, project CRUD, PRD generation) but **the core conversation feature is broken** (streaming mismatch), **5 UI features call non-existent endpoints**, **the settings page doesn't exist**, and **BYOK is advertised but not implemented**. There's also significant dead code and tech debt from the Supabase migration.

---

## Phase 1: Critical Fixes (app is broken without these)

### 1.1 Fix conversation streaming mismatch
- **Problem**: Client (`conversation.tsx:251-305`) expects SSE (`data: {"content":"..."}` lines via ReadableStream), server (`routes.ts:1153`) returns `res.json()`. AI responses never display.
- **Fix**: Convert server endpoint to SSE streaming — set `Content-Type: text/event-stream`, stream AI response chunks, send `data: {"content":"...","done":true}` lines. Requires streaming support in Gemini/Anthropic adapters.
- **Impact**: Core feature — the interview conversation is the whole point of the app.

### 1.2 Fix Stripe webhook
- **Problem**: Webhook route (`routes.ts:1867`) is registered after `app.use('/api', requireAuth)` (`routes.ts:316`) → Stripe gets 401. Also, `vercel-entry.ts` parses JSON body before webhook, so `stripe.webhooks.constructEvent()` can't verify the signature (needs raw body).
- **Fix**: Move webhook registration before `requireAuth`. Add raw body capture for `/api/webhook/stripe` path in `vercel-entry.ts` (use `express.raw` for that specific path).
- **Impact**: Subscriptions can't be processed — Pro tier is non-functional on Vercel.

### 1.3 Fix settings button + create settings page
- **Problem**: `app-layout.tsx:65-70` — Settings button has no `onClick`. No `/app/settings` route exists. No settings page component.
- **Fix**: Create `client/src/pages/settings.tsx` with tabs: Profile (email, change password), API Keys (BYOK), Billing (Stripe portal link), Danger Zone (delete account). Add route in `App.tsx`. Wire button to navigate.
- **Impact**: Users can't manage their account or configure BYOK.

### 1.4 Remove dead UI features (voice/TTS/landing-page/communities/reality-check)
- **Problem**: 5 features in the UI call endpoints that don't exist:
  - `conversation.tsx:97` → `/api/speech-to-text` (voice input)
  - `conversation.tsx:137` → `/api/text-to-speech` (TTS playback)
  - `prd-view.tsx:185` → `/api/projects/:id/generate-landing-page`
  - `prd-view.tsx:215` → `/api/projects/:id/find-communities`
  - `prd-view.tsx:240` → `/api/projects/:id/reality-check`
- **Fix**: Remove the voice/TTS buttons from conversation.tsx. Remove the three dead feature sections from prd-view.tsx. These were never implemented and add confusion.
- **Impact**: Clean UX — no more broken buttons.

---

## Phase 2: BYOK (Bring Your Own Key)

### 2.1 Database schema for user API keys
- Add `user_api_keys` table: `id`, `userId`, `provider` (gemini|anthropic|openai), `encryptedKey`, `createdAt`, `lastUsedAt`.
- Encrypt keys at rest using AES-256-GCM with a server-side `ENCRYPTION_KEY` env var.
- Add `drizzle-kit push` to create the table.

### 2.2 Server-side BYOK logic
- New endpoints: `GET /api/user/keys` (list, masked), `POST /api/user/keys` (save), `DELETE /api/user/keys/:id`.
- Modify `AIService` interface: add `setApiKey(key: string)` method or pass key per-call.
- Modify route handlers: check for user's BYOK key first, fall back to server default key. Per-request AI service instantiation when BYOK key is present.
- Add `ENCRYPTION_KEY` env var to Vercel.

### 2.3 Settings page BYOK UI
- API Keys tab in settings page: dropdown for provider (Gemini, Anthropic, OpenAI), input for API key, save/delete buttons.
- Show masked keys (e.g., `sk-ant-...x7f2`).
- Link to provider docs for getting keys.
- Test connection button (makes a minimal API call to verify the key works).

---

## Phase 3: Dead Code Cleanup

### 3.1 Delete dead files
- `client/src/pages/home.tsx` (616 lines, not imported, superseded by new-idea.tsx)
- `client/src/components/layout.tsx` (not imported anywhere)

### 3.2 Remove unused npm dependencies (7)
- `@supabase/supabase-js` — no longer imported
- `passport` — never used
- `passport-local` — never used
- `connect-pg-simple` — never used
- `express-session` — never used
- `memorystore` — never used
- `openai` — imported in service.ts type but no adapter exists

### 3.3 Fix stale references
- Rename `client/src/lib/supabase.ts` → `client/src/lib/auth.ts` (update all imports)
- Update `.env.example` — remove Supabase vars, add `JWT_SECRET`, `ENCRYPTION_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`
- Fix `server/test/mcp.test.ts` — mock `../storage` not `../storage-supabase`
- Fix `shared/schema.ts:13` — update comment from "Legacy - unused with Supabase Auth" to "bcrypt hash"
- Fix `package.json` name from `rest-express` to `idea-foundry`

### 3.4 Consolidate Express setup
- `server/app.ts` (local) and `server/vercel-entry.ts` (serverless) have inconsistent middleware (helmet, rate limiters, CORS, raw body). Extract shared middleware into `server/middleware.ts` and use in both.

---

## Phase 4: UX Polish

### 4.1 Fix pricing inconsistency
- Landing page says $15/mo, upgrade page says $19/mo. Pick one and align both.

### 4.2 Fix Sign Out
- `app-layout.tsx:72` — Sign Out navigates to `/` but doesn't clear the JWT token. Should call `signOut()` then navigate to `/auth`.

### 4.3 Fix health check
- `routes.ts:240` — `storage.getUser("health-check-nonexistent")` throws when user doesn't exist, returning 500. Should catch `undefined` and return 200.

### 4.4 Fix AI model strings
- `gemini.ts:8` — hardcoded `gemini-1.5-flash` (comment in routes.ts says "Gemini 3.0 Flash"). Update to current model.
- `anthropic.ts:7` — hardcoded `claude-3-5-sonnet-20241022`. Update to current model.

### 4.5 Password reset
- `auth.tsx:76` — shows "not available yet". Either implement (needs email service) or remove the reset option entirely.

---

## Phase 5: Security Hardening

### 5.1 JWT secret fallback
- `server/auth.ts:8` — falls back to `'dev-secret-change-in-production'` if `JWT_SECRET` is missing. Should throw in production instead.

### 5.2 Input validation
- `routes.ts:567` — `PATCH /api/projects/:id` passes raw `req.body` to `storage.updateProject()`. Add Zod validation.

### 5.3 Rate limiting
- `server/vercel.ts` has rate limiter paths that don't match actual routes (`/api/projects/:id/prd` should be `/generate-prd`, `/api/projects/:id/synergy` should be `/synergies`).

---

## Phase 6: Developer Experience

### 6.1 Update AI model options
- Make AI model configurable via env var (`GEMINI_MODEL`, `ANTHROPIC_MODEL`) with sensible defaults.

### 6.2 Fix duplicate storage selection
- `routes.ts`, `mcp/index.ts`, `mcp/auth.ts` all duplicate the `isDevMode ? mockStorage : dbStorage` pattern. Extract to a shared `getStorage()` function.

### 6.3 Consolidate toast systems
- App uses both Radix toast (`useToast`) and Sonner toast inconsistently across pages. Pick one (Sonner is newer) and migrate.

### 6.4 Remove legacy routes
- `App.tsx` maintains both `/app/*` and legacy `/*` routes (dashboard, idea, conversation, prd). Once all internal links use `/app/*`, remove legacy routes.

---

## Priority Order

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | Fix conversation streaming | M | Critical — core feature broken |
| 2 | Fix settings button + page | S | High — users can't manage account |
| 3 | Remove dead UI features | S | Medium — clean up broken buttons |
| 4 | Fix Stripe webhook | S | High — payments broken on Vercel |
| 5 | BYOK implementation | L | High — advertised, not delivered |
| 6 | Dead code cleanup | S | Medium — reduce confusion |
| 7 | Fix Sign Out | XS | Medium — security/UX bug |
| 8 | Fix pricing inconsistency | XS | Low — trust |
| 9 | Fix health check | XS | Low — monitoring |
| 10 | Security hardening | M | Medium — defense in depth |

**S** = small (1-2h), **M** = medium (half day), **L** = large (1-2 days)
