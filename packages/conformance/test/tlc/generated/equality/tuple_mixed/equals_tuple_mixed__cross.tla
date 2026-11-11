(*---
description: Compares tuple_mixed, a TupleValue, with cross, a SetOfTuplesValue.
ref: tlc2/value/impl/TupleValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_tuple_mixed__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, "a", {TRUE}>>) = ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_tuple_mixed__cross failed.
    Attempted to check equality of the function <<1, "a", {TRUE}>> with the value:
    {<<1, 3>>, <<2, 3>>}
---*)
