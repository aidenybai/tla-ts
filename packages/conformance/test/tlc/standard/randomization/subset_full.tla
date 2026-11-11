(*---
description: k = |S| gives S.
ref: tlc2/module/Randomization.java#RandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_full ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubset(2, {1, 2}) = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
