(*---
description: apply of function_lazy, a FcnLambdaValue, and set_filter, a SetPredValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_lazy__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x])[{x \in 1..3 : x > 1}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_function_lazy__set_filter failed.
    2158:0 Attempted to check if the value:
    {2, 3}
    is an element of Nat.
---*)
