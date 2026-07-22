import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm } from "fs/promises";

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server (for local/non-Vercel production)...");
  
  // Build standalone server for local/non-Vercel production
  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    logLevel: "info",
  });

  console.log("building Vercel serverless function...");
  
  // Bundle the API function with all dependencies for Vercel
  // Vercel's native TS compilation doesn't bundle imports, so we must pre-bundle
  await esbuild({
    entryPoints: ["server/vercel-entry.ts"],
    platform: "node",
    bundle: true,
    format: "esm",
    outfile: "api/index.mjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    banner: {
      js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
    },
    external: [],
    minify: true,
    logLevel: "info",
  });

  // Run database migrations on Vercel (where DATABASE_URL / ideas_DATABASE_URL is set)
  if (process.env.DATABASE_URL || process.env.ideas_DATABASE_URL || process.env.POSTGRES_URL) {
    console.log("running drizzle-kit push...");
    const { execSync } = await import("child_process");
    try {
      execSync("npx drizzle-kit push", { stdio: "inherit", env: process.env });
      console.log("database schema pushed");
    } catch (e) {
      console.error("drizzle-kit push failed (non-fatal):", e);
      // Don't fail the build — the app can still deploy, migrations can be run separately
    }
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
