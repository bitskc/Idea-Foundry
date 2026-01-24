import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "@supabase/supabase-js",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "helmet",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "postgres",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

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
    external: externals,
    logLevel: "info",
  });

  // Build Vercel serverless handler
  // Use CJS format and externalize Node.js built-ins to avoid dynamic require issues
  console.log("building vercel handler...");
  
  // Node.js built-in modules that must be externalized
  const nodeBuiltins = [
    "node:events",
    "node:buffer",
    "node:stream",
    "node:path",
    "node:fs",
    "node:net",
    "node:tls",
    "node:crypto",
    "node:os",
    "node:url",
    "node:util",
    "node:http",
    "node:https",
    "node:zlib",
    "node:querystring",
    "node:assert",
    "node:child_process",
    "node:dns",
    "node:string_decoder",
    "events",
    "buffer",
    "stream",
    "path",
    "fs",
    "net",
    "tls",
    "crypto",
    "os",
    "url",
    "util",
    "http",
    "https",
    "zlib",
    "querystring",
    "assert",
    "child_process",
    "dns",
    "string_decoder",
  ];
  
  await esbuild({
    entryPoints: ["server/vercel.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/public/api/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: [...externals, ...nodeBuiltins],
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
