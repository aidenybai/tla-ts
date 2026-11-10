(*---
description: colon_greater of tuple_empty, a TupleValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_tuple_empty__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<>>) :> ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| (<<>> :> [x \\in Nat |-> <expression line 14, col 42 to line 14, col 42 of module colon_greater_tuple_empty__function_lazy>])"
---*)
