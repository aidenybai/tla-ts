(*---
description: colon_greater of false, a BoolValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_false__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((FALSE) :> ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (FALSE :> [x \\in Nat |-> <expression line 14, col 43 to line 14, col 43 of module colon_greater_false__function_lazy>])"
---*)
