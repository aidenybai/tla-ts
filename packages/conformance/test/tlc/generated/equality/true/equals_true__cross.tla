(*---
description: Compares true, a BoolValue, with cross, a SetOfTuplesValue.
ref: tlc2/value/impl/BoolValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_true__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) = ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_true__cross failed.
    Attempted to compare equality of boolean TRUE with non-boolean:
    {<<1, 3>>, <<2, 3>>}
---*)
