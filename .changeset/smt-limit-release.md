---
"tla-ts": patch
---

The SMT solver stops watching the garbage collector however a check ends. A problem without `check-sat`, an unsupported input, or a stack overflow ended the check without releasing its resource limit, so a `GCProfiler` it had started near the heap limit kept running in the caller's process.
