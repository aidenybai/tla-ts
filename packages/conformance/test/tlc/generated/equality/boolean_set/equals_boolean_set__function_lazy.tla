(*---
description: Compares boolean_set, a SetEnumValue, with function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_boolean_set__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) = ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_boolean_set__function_lazy failed.
    Attempted to check equality of the set {FALSE, TRUE} with the value:
    [x \in Nat |-> <expression line 14, col 44 to line 14, col 44 of module equals_boolean_set__function_lazy>]
---*)
