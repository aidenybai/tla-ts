(*---
description: Compares nat, a UserValue, with function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_nat__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Nat) = ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_nat__function_lazy failed.
    Attempted to compare overridden value Nat with non-overridden value:
    [x \in Nat |-> <expression line 14, col 40 to line 14, col 40 of module equals_nat__function_lazy>]
---*)
