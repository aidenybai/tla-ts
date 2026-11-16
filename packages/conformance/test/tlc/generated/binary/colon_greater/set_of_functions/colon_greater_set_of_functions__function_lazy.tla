(*---
description: colon_greater of set_of_functions, a SetOfFcnsValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_set_of_functions__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([{1} -> {2, 3}]) :> ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ({<<2>>, <<3>>} :> [x \\in Nat |-> <expression line 14, col 53 to line 14, col 53 of module colon_greater_set_of_functions__function_lazy>])"
---*)
