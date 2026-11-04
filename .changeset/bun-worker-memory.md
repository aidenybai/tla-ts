---
"tla-ts": patch
---

Let Bun collect garbage during parallel model checking. Each worker now takes a short break about every 100 ms of a level, so ten workers on a large model no longer use more memory than the machine has.
