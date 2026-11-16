(*---
description: apply of function_lazy, a FcnLambdaValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_lazy__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x])[[x \in Nat |-> x]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_function_lazy__function_lazy failed.
    2158:0 Attempted to check if the value:
    [x \in Nat |-> <expression line 14, col 51 to line 14, col 51 of module apply_function_lazy__function_lazy>]
    is an element of Nat.
---*)
