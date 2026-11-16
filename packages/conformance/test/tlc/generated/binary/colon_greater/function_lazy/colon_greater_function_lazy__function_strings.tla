(*---
description: colon_greater of function_lazy, a FcnLambdaValue, and function_strings, a FcnRcdValue.
ref: tlc2/module/TLC.java#MakeFcn
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE colon_greater_function_lazy__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x]) :> ([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| ([x \in Nat |-> <expression line 14, col 32 to line 14, col 32 of module colon_greater_function_lazy__function_strings>] :> [a |-> "a", b |-> "b"])'
---*)
