(*---
description: colon_greater of tuple_mixed, a TupleValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_tuple_mixed__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, "a", {TRUE}>>) :> ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| (<<1, "a", {TRUE}>> :> [x \in Nat |-> <expression line 14, col 56 to line 14, col 56 of module colon_greater_tuple_mixed__function_lazy>])'
---*)
