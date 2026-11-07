(*---
description: greater_equal_right applied to function_lazy, a FcnLambdaValue.
ref: tlc2/module/Naturals.java#GEQ
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE greater_equal_right_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2 >= [x \in Nat |-> x])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of >= should be an integer, but instead it is:
    [x \in Nat |-> <expression line 14, col 36 to line 14, col 36 of module greater_equal_right_function_lazy>]
    2266:0 The second argument of >= should be an integer, but instead it is:
    [x \in Nat |-> <expression line 14, col 36 to line 14, col 36 of module greater_equal_right_function_lazy>]
---*)
