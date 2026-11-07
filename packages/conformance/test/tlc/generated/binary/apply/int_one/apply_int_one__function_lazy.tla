(*---
description: apply of int_one, a IntValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_int_one__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1)[[x \in Nat |-> x]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_int_one__function_lazy failed.
    A non-function (an integer) was applied as a function.
    line 14, col 16 to line 14, col 37 of module apply_int_one__function_lazy
---*)
