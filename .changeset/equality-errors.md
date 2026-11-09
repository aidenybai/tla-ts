---
"tla-ts": patch
---

Report TLC's error when comparing stored values of different types, such as a record and a tuple. Their hashes used to decide the comparison first, so the check passed where TLC fails.
