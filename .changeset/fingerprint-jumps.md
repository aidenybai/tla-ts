---
"tla-ts": patch
---

Extend a fingerprint by a run of zero bytes with a table for each power of two words. `PaxosCommit` falls from 1,234 G to 1,171 G instructions, `Detlefs` from 373 G to 359 G, and `MCLamportMutex` from 174 G to 167 G.
