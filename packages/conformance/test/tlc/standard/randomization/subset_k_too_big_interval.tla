(*---
description: k > |S| on an interval is also S.
ref: tlc2/value/impl/IntervalValue.java#getRandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_k_too_big_interval ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubset(3, 1..2) = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
