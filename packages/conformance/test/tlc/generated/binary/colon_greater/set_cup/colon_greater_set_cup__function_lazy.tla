(*---
description: colon_greater of set_cup, a SetCupValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_cup__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1} \cup {2}) :> ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({1, 2} :> [x \\in Nat |-> <expression line 14, col 50 to line 14, col 50 of module colon_greater_set_cup__function_lazy>])"
---*)
