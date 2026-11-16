(*---
description: cap of function_lazy, a FcnLambdaValue, and set_filter, a SetPredValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_function_lazy__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x]) \cap ({x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_function_lazy__set_filter failed.
    Attempted to check if the value:
    2
    is an element of the function [x \in Nat |-> <expression line 14, col 32 to line 14, col 32 of module cap_function_lazy__set_filter>]
---*)
