(*---
description: colon_greater of function_lazy, a FcnLambdaValue, and colon_greater, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function_lazy__colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x]) :> (1 :> 2))
====

(*--- recorded
all:
  exit: 0
  transcript: "| ([x \\in Nat |-> <expression line 14, col 32 to line 14, col 32 of module colon_greater_function_lazy__colon_greater>] :> <<2>>)"
---*)
