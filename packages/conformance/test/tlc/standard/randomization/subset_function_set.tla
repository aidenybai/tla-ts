(*---
description: A function set works.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_function_set ----
EXTENDS Randomization, FiniteSets, Naturals
Test == Cardinality(RandomSubset(2, [{1, 2} -> {3, 4}])) = 2
====

(*--- recorded
all:
  exit: 0
---*)
