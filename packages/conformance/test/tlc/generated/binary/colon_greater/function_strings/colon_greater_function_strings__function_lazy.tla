(*---
description: colon_greater of function_strings, a FcnRcdValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function_strings__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x]) :> ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ([a |-> "a", b |-> "b"] :> [x \in Nat |-> <expression line 14, col 62 to line 14, col 62 of module colon_greater_function_strings__function_lazy>])'
---*)
