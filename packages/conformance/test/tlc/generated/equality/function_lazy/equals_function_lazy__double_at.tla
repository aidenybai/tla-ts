(*---
description: Compares function_lazy, a FcnLambdaValue, with double_at, a FcnRcdValue.
ref: tlc2/value/impl/FcnLambdaValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_function_lazy__double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x]) = ((1 :> 2) @@ (2 :> 3)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_function_lazy__double_at failed.
    Attempted to compute the number of elements in the overridden value Nat.
---*)
