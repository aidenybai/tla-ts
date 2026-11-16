(*---
description: A SUBSET works.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_of_subset ----
EXTENDS Randomization, FiniteSets, Naturals
Test == Cardinality(RandomSubset(2, SUBSET {1, 2})) = 2
====

(*--- recorded
all:
  exit: 0
---*)
