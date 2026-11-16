(*---
description: Over the empty set with n = 0, the probability divides 0 by 0, giving NaN, which passes the range check.
ref: tlc2/module/Randomization.java#RandomSetOfSubsets
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE sos_empty_set_n_zero ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSetOfSubsets(1, 0, {}) \subseteq {{}}
====

(*--- recorded
all:
  exit: 0
---*)
