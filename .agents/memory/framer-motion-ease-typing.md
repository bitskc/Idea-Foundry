---
name: framer-motion ease type widening
description: Why standalone framer-motion variant/transition consts fail typecheck on the `ease` field, and how to fix.
---

When a framer-motion `variants` or `transition` object is declared as a standalone
const (not inline in JSX), TypeScript infers `ease: "easeOut"` as the wide type
`string`, which is NOT assignable to framer-motion's `Easing` union. The typecheck
error appears at the *usage* site (`<motion.div variants={...}>` or
`transition={...}` / spread props), not at the definition, with messages like
"not assignable to type 'Variants'" or "Omit<HTMLMotionProps<'div'>>".

**Why:** Object literals without contextual typing widen string literals; framer-motion
needs the literal type to match its `Easing` union.

**How to apply:** Minimal fix is `as const` on the ease value (`ease: "easeOut" as const`)
— no new import needed. Alternatively annotate the const with `Variants` / `Transition`
imported from "framer-motion". Inline literals written directly in JSX get contextual
typing and never hit this.
