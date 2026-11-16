(*---
description: apply of double_at, a FcnRcdValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_double_at__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((1 :> 2) @@ (2 :> 3))[[x \in Nat |-> x]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_double_at__function_lazy failed.
    Attempted to check equality of integer 1 with non-integer:
    [x \in Nat |-> <expression line 14, col 54 to line 14, col 54 of module apply_double_at__function_lazy>]
---*)
