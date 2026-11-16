(*---
description: colon_greater_key applied to function_lazy, a FcnLambdaValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_key_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([x \in Nat |-> x] :> 1)
====

(*--- recorded
all:
  exit: 0
  transcript: "| ([x \\in Nat |-> <expression line 14, col 31 to line 14, col 31 of module colon_greater_key_function_lazy>] :> 1)"
---*)
