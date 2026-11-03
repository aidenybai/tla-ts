---
"tla-ts": patch
---

Check actions faster when other guards come before their label guard, as in `turn = self /\ pc[self] = "a"` (#342).
