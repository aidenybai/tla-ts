(*---
description: The result has exactly k elements, all from S.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_cardinality ----
EXTENDS Randomization, FiniteSets, Naturals
Test == LET T == RandomSubset(3, 1..9) IN Cardinality(T) = 3 /\ T \subseteq 1..9
====

(*--- recorded
all:
  exit: 0
---*)
