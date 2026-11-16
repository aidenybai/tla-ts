(*---
description: Compares set_empty, a SetEnumValue, with function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_empty__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) = ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_set_empty__function_lazy failed.
    Attempted to check equality of the set {} with the value:
    [x \in Nat |-> <expression line 14, col 39 to line 14, col 39 of module equals_set_empty__function_lazy>]
---*)
