(*---
description: "k > |S| is no error: the enumerator stops at |S|, so the result is S. The definition's CHOOSE would fail."
ref: tlc2/value/impl/EnumerableValue.java#SubsetEnumerator
features:
  - Randomization
flags:
  - expression
outcome: success
---*)
---- MODULE subset_k_too_big ----
EXTENDS Randomization, FiniteSets, Naturals
Test == RandomSubset(3, {1, 2}) = {1, 2}
====

(*--- recorded
all:
  exit: 0
---*)
