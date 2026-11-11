(*---
description: k = 0 gives the empty set.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_zero ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubset(0, {1, 2}) = {}
====

(*--- recorded
all:
  exit: 0
---*)
