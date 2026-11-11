(*---
description: diff of interval, a IntervalValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_interval__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) \ ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module diff_interval__function_lazy failed.
    Attempted to check if the value:
    1
    is an element of the function [x \in Nat |-> <expression line 14, col 41 to line 14, col 41 of module diff_interval__function_lazy>]
---*)
