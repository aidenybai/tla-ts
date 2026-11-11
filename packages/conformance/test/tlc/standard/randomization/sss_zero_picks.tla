(*---
description: k = 0 picks no subsets.
ref: tlc2/module/Randomization.java#RandomSubsetSet
features:
  - Randomization
flags:
  - expression
outcome: success
includes:
  - Randomization.tla
---*)
---- MODULE sss_zero_picks ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubsetSet(0, "0.5", {1, 2}) = {}
====

(*--- recorded
all:
  exit: 0
---*)
