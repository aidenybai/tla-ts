(*---
description: append of double_at, a FcnRcdValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_double_at__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append((1 :> 2) @@ (2 :> 3), [x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<2, 3, [x \\in Nat |-> <expression line 14, col 60 to line 14, col 60 of module append_double_at__function_lazy>]>>"
---*)
