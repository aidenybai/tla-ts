(*---
description: There are at most k picks, duplicates collapsing.
ref: tlc2/module/Randomization.java#RandomSetOfSubsets
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE sos_at_most_k ----
EXTENDS Randomization, FiniteSets, Naturals
Test == Cardinality(RandomSetOfSubsets(5, 2, 1..6)) <= 5
====

(*--- recorded
all:
  exit: 0
---*)
