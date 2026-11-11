(*---
description: colon_greater of record, a RecordValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_record__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a |-> 1, b |-> 2]) :> ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ([a |-> 1, b |-> 2] :> [x \\in Nat |-> <expression line 14, col 56 to line 14, col 56 of module colon_greater_record__function_lazy>])"
---*)
