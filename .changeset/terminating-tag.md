---
"tla-ts": patch
---

Mark the end states of a TypeScript model with `@terminating` on a boolean function. States where it holds take a step that changes nothing, like PlusCal's `Terminating`, so they aren't deadlocks, and deadlock checking stays on for the rest.
