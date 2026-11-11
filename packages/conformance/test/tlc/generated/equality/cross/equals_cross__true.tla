(*---
description: Compares cross, a SetOfTuplesValue, with true, a BoolValue.
ref: tlc2/value/impl/SetOfTuplesValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_cross__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) = (TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_cross__true failed.
    Attempted to check equality of the set {<<1, 3>>, <<2, 3>>} with the value:
    TRUE
---*)
