(*---
description: append of function, a FcnRcdValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_function__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append([x \in {1, 2} |-> x * 2], [x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 4, [x \\in Nat |-> <expression line 14, col 64 to line 14, col 64 of module append_function__function_lazy>]>>"
---*)
