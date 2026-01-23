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
- **shared/** - Drizzle ORM schema + Zod validation, shared types between client/server
- **Database:** PostgreSQL via Drizzle ORM

## Code Style
- ESM modules (`"type": "module"`)
- Path aliases: `@/*` → client/src, `@shared/*` → shared
- Use Zod for validation, drizzle-zod for schema types
- React Query for data fetching, react-hook-form for forms
- Prefer Radix primitives via shadcn components in `client/src/components/ui/`
- Strict TypeScript; avoid `any`
