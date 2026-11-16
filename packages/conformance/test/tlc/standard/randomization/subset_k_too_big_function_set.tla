(*---
description: k > |S| on a function set is also S.
ref: tlc2/value/impl/SetOfFcnsOrRcdsValue.java#getRandomSubset
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_k_too_big_function_set ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubset(9, [{1} -> {2, 3}]) = [{1} -> {2, 3}]
====

(*--- recorded
all:
  exit: 0
---*)
