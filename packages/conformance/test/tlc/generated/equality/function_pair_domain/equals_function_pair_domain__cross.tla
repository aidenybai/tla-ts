(*---
description: Compares function_pair_domain, a FcnRcdValue, with cross, a SetOfTuplesValue.
ref: tlc2/value/impl/FcnRcdValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_function_pair_domain__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {1}, y \in {2} |-> x + y]) = ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_function_pair_domain__cross failed.
    Attempted to check equality of the function (<<1, 2>> :> 3) with the value:
    {<<1, 3>>, <<2, 3>>}
---*)
