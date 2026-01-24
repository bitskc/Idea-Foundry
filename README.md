# Idea Foundry

Idea Foundry is an AI-powered platform for entrepreneurs to capture, refine, and validate business ideas. It acts as a "supportive co-founder" or "brutal challenger" to help you think through problems, identify target audiences, and generate Product Requirement Documents (PRDs).

## Features

- **AI Co-Founder**: Chat with an AI that adapts to your needs (Supportive or Challenger mode).
- **PRD Generation**: Automatically transform conversations into structured product requirements.
- **Viability Scoring**: Get an AI assessment of your idea's market potential and competition.
- **Synergy Analysis**: Discover cross-promotion and integration opportunities between your projects.
- **Voice Interaction**: Speak your ideas and hear the feedback (Client-side TTS/STT).

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js, Express (Serverless-ready for Vercel)
- **Database**: PostgreSQL (Supabase) + Drizzle ORM
- **AI**: Google Gemini (via `google-generative-ai`) and Anthropic Claude (via `anthropic-sdk`)
- **Authentication**: Supabase Auth

## Prerequisites

- Node.js 20+
- Supabase Account
- Google Gemini API Key
- Anthropic API Key (Optional, for advanced reasoning)

## Local Development

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd Idea-Foundry
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Copy `.env.example` to `.env` and fill in the required values:
   ```bash
   cp .env.example .env
   ```
   *See Environment Variables section below.*

4. **Database Setup**
   Push the schema to your Supabase database:
   ```bash
   npm run db:push
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:5000`.

## Testing

Run the automated test suite:
```bash
npm run test
```

## Deployment (Vercel)

This project is configured for Vercel deployment.

1. Install Vercel CLI: `npm install -g vercel`
2. Run `vercel` to deploy.
3. Ensure all environment variables are set in the Vercel project settings.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase Protocol Connection String (Transaction Mode preferred) |
| `GEMINI_API_KEY` | Google AI Studio API Key |
| `ANTHROPIC_API_KEY` | (Optional) Anthropic API Key |
| `VITE_SUPABASE_URL` | Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Public Key |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | (Legacy/Optional) |

## License

MIT

