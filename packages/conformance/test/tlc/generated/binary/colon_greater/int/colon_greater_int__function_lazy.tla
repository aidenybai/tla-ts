(*---
description: colon_greater of int, a UserValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_int__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int) :> ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Int :> [x \\in Nat |-> <expression line 14, col 41 to line 14, col 41 of module colon_greater_int__function_lazy>])"
---*)
