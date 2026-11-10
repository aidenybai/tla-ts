(*---
description: Compares int_zero, a IntValue, with cross, a SetOfTuplesValue.
ref: tlc2/value/impl/IntValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_int_zero__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0) = ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_int_zero__cross failed.
    Attempted to check equality of integer 0 with non-integer:
    {<<1, 3>>, <<2, 3>>}
---*)
