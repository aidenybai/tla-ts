(*---
description: apply of function_lazy, a FcnLambdaValue, and int_maximum, a IntValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_lazy__int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x])[2147483647])
====

(*--- recorded
all:
  exit: 0
  transcript: "| 2147483647"
---*)
