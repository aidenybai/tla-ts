(*---
description: apply of function_lazy, a FcnLambdaValue, and set_cup, a SetCupValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_lazy__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x])[{1} \cup {2}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    {1, 2}
    is an element of Nat.
    2158:0 Attempted to check if the value:
    {1, 2}
    is an element of Nat.
---*)
