---
"tla-ts": patch
---

Check specs with less CPU time. The checker reads and parses a spec's modules once instead of once for each order TLC uses, and parses TLC's own modules once per process.
