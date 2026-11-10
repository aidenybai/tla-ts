(*---
description: All results match the TLA+ definition over small sets.
ref: tlc2/module/TLC.java#Permutations
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE permutations_are_bijections ----
EXTENDS TLC, Naturals
Test == Permutations({1, 2, 3}) = {f \in [{1, 2, 3} -> {1, 2, 3}] : \A w \in {1, 2, 3} : \E v \in {1, 2, 3} : f[v] = w}
====

(*--- recorded
all:
  exit: 0
---*)
