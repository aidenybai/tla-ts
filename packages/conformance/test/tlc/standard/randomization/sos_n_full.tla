(*---
description: n = |S| has probability 1, so all picks collapse to S.
ref: tlc2/module/Randomization.java#RandomSetOfSubsets
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE sos_n_full ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSetOfSubsets(3, 2, {1, 2}) = {{1, 2}}
====

(*--- recorded
all:
  exit: 0
---*)
