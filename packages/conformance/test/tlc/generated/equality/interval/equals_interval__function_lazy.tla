(*---
description: Compares interval, a IntervalValue, with function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/IntervalValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_interval__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3) = ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_interval__function_lazy failed.
    Attempted to check equality of the set {1, 2, 3} with the value:
    [x \in Nat |-> <expression line 14, col 41 to line 14, col 41 of module equals_interval__function_lazy>]
---*)
