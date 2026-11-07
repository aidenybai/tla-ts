(*---
description: apply of function_lazy, a FcnLambdaValue, and function, a FcnRcdValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_lazy__function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x])[[x \in {1, 2} |-> x * 2]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    <<2, 4>>
    is an element of Nat.
    2158:0 Attempted to check if the value:
    <<2, 4>>
    is an element of Nat.
---*)
