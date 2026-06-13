import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Use postgres-js for Supabase with connection pooling
// IMPORTANT: Supabase free tier requires IPv6. On Vercel, use Supabase's connection pooler:
// Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
const queryClient = postgres(process.env.DATABASE_URL, {
  max: 1, // Limit connections for serverless - each invocation gets 1 connection
  ssl: 'require',
  idle_timeout: 20, // Close idle connections quickly in serverless
  connect_timeout: 10 // Fail fast if can't connect
});

export const db = drizzle(queryClient, { schema });
