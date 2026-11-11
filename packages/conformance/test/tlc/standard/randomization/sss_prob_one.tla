(*---
description: Probability 1 collapses picks to S.
ref: tlc2/module/Randomization.java#RandomSubsetSet
features:
  - Randomization
flags:
  - expression
outcome: success
includes:
  - Randomization.tla
---*)
---- MODULE sss_prob_one ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubsetSet(3, "1", {1, 2}) = {{1, 2}}
====

(*--- recorded
all:
  exit: 0
---*)
