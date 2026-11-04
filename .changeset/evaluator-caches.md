---
"tla-ts": patch
---

Compile specs faster and evaluate them as TLC does. One pass over the definitions computes their levels, effects and read variables, and the evaluator's value caches are gone, so operators and lazy functions evaluate again at each use. State checking is 5–15% slower without the fingerprinter's value cache, and a check no longer shares TLC's own modules with earlier checks in the process.
