import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, mkdir, copyFile } from "fs/promises";

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
  
  // Bundle the API entry point with all dependencies for Vercel
  // This creates a self-contained bundle that doesn't need external imports
  await esbuild({
    entryPoints: ["api/index.ts"],
    platform: "node",
    bundle: true,
    format: "esm",
    outfile: "api/index.js",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    // Don't externalize anything - bundle everything
    external: [],
    // Banner to handle dynamic requires
    banner: {
      js: `
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
`,
    },
    logLevel: "info",
  });

  console.log("build complete!");
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
