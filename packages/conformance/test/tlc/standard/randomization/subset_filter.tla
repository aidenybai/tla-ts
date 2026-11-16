(*---
description: A filter works since it is already enumerated.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_filter ----
EXTENDS Randomization, FiniteSets, Naturals
Test == Cardinality(RandomSubset(1, {x \in 1..3 : x > 1})) = 1
====

(*--- recorded
all:
  exit: 0
---*)
