(*---
description: cap of function_lazy, a FcnLambdaValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_function_lazy__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x]) \cap (BOOLEAN))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cap_function_lazy__boolean_set failed.
    Attempted to check if the value:
    FALSE
    is an element of the function [x \in Nat |-> <expression line 14, col 32 to line 14, col 32 of module cap_function_lazy__boolean_set>]
---*)
