(*---
description: apply of function_lazy, a FcnLambdaValue, and double_at, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_lazy__double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x])[(1 :> 2) @@ (2 :> 3)])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    <<2, 3>>
    is an element of Nat.
    2158:0 Attempted to check if the value:
    <<2, 3>>
    is an element of Nat.
---*)
