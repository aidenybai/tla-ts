(*---
description: apply of function_lazy, a FcnLambdaValue, and tuple_mixed, a TupleValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_lazy__tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x])[<<1, "a", {TRUE}>>])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2158:0 Attempted to check if the value:
    <<1, "a", {TRUE}>>
    is an element of Nat.
    2158:0 Attempted to check if the value:
    <<1, "a", {TRUE}>>
    is an element of Nat.
---*)
