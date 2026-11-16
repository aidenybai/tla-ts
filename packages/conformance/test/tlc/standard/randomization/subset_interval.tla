(*---
description: An interval is enumerable.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_interval ----
EXTENDS Randomization, FiniteSets, Naturals
Test == Cardinality(RandomSubset(2, 1..5)) = 2
====

(*--- recorded
all:
  exit: 0
---*)
