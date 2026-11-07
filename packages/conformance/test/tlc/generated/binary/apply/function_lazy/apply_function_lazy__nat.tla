(*---
description: apply of function_lazy, a FcnLambdaValue, and nat, a UserValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_lazy__nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x])[Nat])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    Nat
    is an element of Nat.
    2158:0 Attempted to check if the value:
    Nat
    is an element of Nat.
---*)
