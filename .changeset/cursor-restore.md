---
"tla-ts": patch
---

When a temporal property fails to evaluate, the trace tla-ts prints for the failure now reads `TLCGet("level")` of the search, as TLC's does. The liveness checker left its source state set when an evaluation threw, so every step of the trace read the level of the state it last checked.
