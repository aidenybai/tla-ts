(*---
description: cap of set_filter, a SetPredValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_filter__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x \in 1..3 : x > 1}) \cap ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_set_filter__cross failed.
    Attempted to check if non-tuple
    2
    is in the set of tuples:
    {<<1, 3>>, <<2, 3>>}
---*)
