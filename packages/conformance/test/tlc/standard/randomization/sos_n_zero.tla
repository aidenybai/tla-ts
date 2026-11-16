(*---
description: n = 0 has probability 0, so all picks collapse to the empty set.
ref: tlc2/module/Randomization.java#RandomSetOfSubsets
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE sos_n_zero ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSetOfSubsets(3, 0, {1, 2}) = {{}}
====

(*--- recorded
all:
  exit: 0
---*)
