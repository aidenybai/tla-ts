(*---
description: apply_function applied to function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_function_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x])[1])
====

(*--- recorded
all:
  exit: 0
  transcript: "| 1"
---*)
