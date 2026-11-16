(*---
description: append of colon_greater, a FcnRcdValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_colon_greater__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(1 :> 2, [x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, [x \\in Nat |-> <expression line 14, col 46 to line 14, col 46 of module append_colon_greater__function_lazy>]>>"
---*)
