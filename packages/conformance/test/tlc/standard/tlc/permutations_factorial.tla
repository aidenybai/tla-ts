(*---
description: n elements have n! permutations.
ref: tlc2/module/TLC.java#Permutations
features:
  - TLC
flags:
  - expression
outcome: success
---*)
---- MODULE permutations_factorial ----
EXTENDS TLC, Naturals, FiniteSets
Test == Cardinality(Permutations({1, 2, 3})) = 6 /\ Cardinality(Permutations(1..5)) = 120
====

(*--- recorded
all:
  exit: 0
---*)
