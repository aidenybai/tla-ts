(*---
description: colon_greater of seq_set, a UserValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_seq_set__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1})) :> ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (Seq({1}) :> [x \\in Nat |-> <expression line 14, col 46 to line 14, col 46 of module colon_greater_seq_set__function_lazy>])"
---*)
