(*---
description: diff of set_map, a SetEnumValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_map__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x + 1 : x \in 1..2}) \ ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module diff_set_map__cross failed.
    Attempted to check if non-tuple
    2
    is in the set of tuples:
    {<<1, 3>>, <<2, 3>>}
---*)
