(*---
description: k = 0 picks no subsets.
ref: tlc2/module/Randomization.java#RandomSetOfSubsets
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE sos_zero_picks ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSetOfSubsets(0, 1, {1, 2}) = {}
====

(*--- recorded
all:
  exit: 0
---*)
