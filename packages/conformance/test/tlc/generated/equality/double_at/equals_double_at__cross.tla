(*---
description: Compares double_at, a FcnRcdValue, with cross, a SetOfTuplesValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_double_at__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((1 :> 2) @@ (2 :> 3)) = ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_double_at__cross failed.
    Attempted to check equality of the function <<2, 3>> with the value:
    {<<1, 3>>, <<2, 3>>}
---*)
