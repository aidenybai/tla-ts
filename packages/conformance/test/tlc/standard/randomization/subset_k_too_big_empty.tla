(*---
description: k = 1 of the empty set is the empty set.
ref: tlc2/value/impl/EnumerableValue.java#SubsetEnumerator
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_k_too_big_empty ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubset(1, {}) = {}
====

(*--- recorded
all:
  exit: 0
---*)
