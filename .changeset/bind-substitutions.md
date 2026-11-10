---
"tla-ts": patch
---

Evaluate an `INSTANCE` substitution once each time an instantiated operator is evaluated, as TLC does with a lazy value, instead of at each use. A substitution that prints now prints as often as in TLC. The summerset `MultiPaxos_MC`, which checks a refinement with `proposed <- proposedSet`, falls from 967 G to 756 G instructions.
