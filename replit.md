# Idea Foundry - Shape Your Ideas Into Reality

## Overview

Idea Foundry is a web application that helps founders vet, refine, and transform raw ideas into actionable plans. Users can capture ideas quickly, explore them through AI-powered conversations, run competitor research, get viability scores, and generate comprehensive PRDs. The platform supports the full journey from brainstorming through validation to documentation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS v4 with shadcn/ui components (new-york style)
- **Animations**: Framer Motion for UI transitions
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Development**: Hot module replacement via Vite middleware
- **Production**: Static file serving from `dist/public`

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command
- **Connection**: Node-postgres Pool with `DATABASE_URL` environment variable

### Data Models
- **Users**: Basic auth with username/password
- **Projects**: Store idea, title, description, type, status, progress, and generated PRD content
- **Conversations**: Track current section and step in the PRD interview process, store answers as JSON
- **Messages**: Individual chat messages with role (user/ai) and content

### AI Integration
- **Provider**: OpenAI API via Replit AI Integrations
- **Environment Variables**: `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`
- **Use Case**: Conversational PRD generation with structured system prompts

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/         # shadcn/ui components
│   │   │   └── app-layout.tsx  # App layout with sidebar navigation
│   │   ├── pages/
│   │   │   ├── landing.tsx     # Marketing landing page (/)
│   │   │   ├── dashboard.tsx   # App dashboard (/app)
│   │   │   ├── new-idea.tsx    # New idea creation (/app/new)
│   │   │   ├── idea-detail.tsx # Idea detail view (/app/ideas/:id)
│   │   │   ├── conversation.tsx # AI conversation (/app/conversation/:id)
│   │   │   └── prd-view.tsx    # PRD view (/app/prd/:id)
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utilities
├── server/           # Express backend
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database operations
│   └── db.ts         # Database connection
├── shared/           # Shared code (schema, types)
└── migrations/       # Drizzle migrations
```

### URL Structure
- `/` - Marketing landing page (www.ideafoundry.app)
- `/app` - User dashboard with all ideas
- `/app/new` - Create new idea
- `/app/ideas/:id` - Idea detail (Overview/Think/Make tabs)
- `/app/conversation/:id` - AI conversation
- `/app/prd/:id` - Generated PRD view

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage (available but may not be active)

### AI Services
- **OpenAI API**: Text generation for conversational PRD building
- **Replit AI Integrations**: Pre-configured audio, image, and chat utilities in `server/replit_integrations/`

### Key NPM Packages
- **drizzle-orm** / **drizzle-kit**: Database ORM and migration tooling
- **drizzle-zod**: Schema validation integration
- **@tanstack/react-query**: Async state management
- **react-markdown**: PRD content rendering
- **framer-motion**: Page transitions and animations
- **wouter**: Client-side routing