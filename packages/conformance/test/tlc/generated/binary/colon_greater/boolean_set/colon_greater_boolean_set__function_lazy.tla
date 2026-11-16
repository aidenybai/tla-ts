(*---
description: colon_greater of boolean_set, a SetEnumValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_boolean_set__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((BOOLEAN) :> ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({FALSE, TRUE} :> [x \\in Nat |-> <expression line 14, col 45 to line 14, col 45 of module colon_greater_boolean_set__function_lazy>])"
---*)
