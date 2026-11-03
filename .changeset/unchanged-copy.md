---
"tla-ts": patch
---

Check `UNCHANGED` faster on specs with many variables. It copies the state once instead of once for each variable it names (#340).
