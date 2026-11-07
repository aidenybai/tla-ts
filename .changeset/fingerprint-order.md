---
"tla-ts": patch
---

Fingerprint a state as TLC does. A state outside the model's constraints is no longer fingerprinted, so a `VIEW` or a symmetry that fails on such a state no longer stops the check, and workers no longer drop a state whose representative matches one outside the model. A `VIEW` now normalizes every variable first, so a value TLC can't normalize fails even when the view doesn't read it.
