(*---
description: Compares true, a BoolValue, with function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/BoolValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_true__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((TRUE) = ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_true__function_lazy failed.
    Attempted to compare equality of boolean TRUE with non-boolean:
    [x \in Nat |-> <expression line 14, col 41 to line 14, col 41 of module equals_true__function_lazy>]
---*)
