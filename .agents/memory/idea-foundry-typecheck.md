---
name: Idea Foundry typecheck baseline
description: Pre-existing out-of-scope TS errors and how to filter them when running npm run check.
---

`npm run check` reports pre-existing TypeScript errors that live ONLY in
`server/replit_integrations/**` (vendored/generated Replit integration code, out of
scope for feature work). To see only app-code errors:

```
npm run check 2>&1 | rg "error TS" | rg -v replit_integrations
```

**Why:** Treating those vendored errors as in-scope wastes time; a clean app-code run
is the real signal.

**How to apply:** Use the filtered command above when validating changes; a clean
result there means app code typechecks.
