import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

// In dev mode (no DATABASE_URL), export a proxy that throws if accessed.
// routes.ts/mcp use mockStorage instead, so this path is never hit in dev.
const databaseUrl = process.env.DATABASE_URL || process.env.ideas_DATABASE_URL || process.env.POSTGRES_URL;

type DB = ReturnType<typeof drizzle<typeof schema>>;

const db: DB = databaseUrl
  ? drizzle(postgres(databaseUrl, {
      max: 1,
      ssl: 'require',
      idle_timeout: 20,
      connect_timeout: 10,
    }), { schema })
  : new Proxy({} as DB, {
      get() { throw new Error("DATABASE_URL not set — use mockStorage in dev mode"); },
    });

export { db };

// Auto-migrate: add assessment columns if missing (idempotent)
if (databaseUrl) {
  const migSql = postgres(databaseUrl, { ssl: 'require', max: 1 });
  const migrations = [
    'ALTER TABLE projects ADD COLUMN IF NOT EXISTS idea_classification JSONB',
    'ALTER TABLE projects ADD COLUMN IF NOT EXISTS development_difficulty JSONB',
    'ALTER TABLE projects ADD COLUMN IF NOT EXISTS difficulty_roi_ratio JSONB',
    'ALTER TABLE projects ADD COLUMN IF NOT EXISTS pivot_suggestions JSONB',
    'ALTER TABLE projects ADD COLUMN IF NOT EXISTS specialist_assessments JSONB',
  ];
  Promise.all(migrations.map(stmt => migSql.unsafe(stmt)))
    .then(() => { console.log('[db] Assessment columns migrated'); return migSql.end(); })
    .catch(e => { console.error('[db] Migration error:', e.message); migSql.end(); });
}
