(*---
description: Compares function_lazy, a FcnLambdaValue, with record, a RecordValue.
ref: tlc2/value/impl/FcnLambdaValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_function_lazy__record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x]) = ([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_function_lazy__record failed.
    Attempted to compute the number of elements in the overridden value Nat.
---*)
