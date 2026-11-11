(*---
description: diff_right applied to function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_right_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, 2} \ [x \in Nat |-> x])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module diff_right_function_lazy failed.
    Attempted to check if the value:
    1
    is an element of the function [x \in Nat |-> <expression line 14, col 40 to line 14, col 40 of module diff_right_function_lazy>]
---*)
