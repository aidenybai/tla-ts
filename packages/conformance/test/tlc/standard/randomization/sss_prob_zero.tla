(*---
description: Probability 0 collapses picks to the empty set.
ref: tlc2/module/Randomization.java#RandomSubsetSet
features:
  - Randomization
flags:
  - expression
outcome: success
includes:
  - Randomization.tla
---*)
---- MODULE sss_prob_zero ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubsetSet(3, "0", {1, 2}) = {{}}
====

(*--- recorded
all:
  exit: 0
---*)
