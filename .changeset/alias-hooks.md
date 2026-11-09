---
"tla-ts": patch
---

With `-continue`, an `ALIAS` no longer changes what `TLCGet("level")` and `Trace` read in the rest of the search. Printing a trace with an alias left both pinned to the trace's last state, so a later invariant that read the level could fail where TLC's holds.
