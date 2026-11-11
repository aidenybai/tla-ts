(*---
description: append_value applied to function_lazy, a FcnLambdaValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_value_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1>>, [x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, [x \\in Nat |-> <expression line 14, col 45 to line 14, col 45 of module append_value_function_lazy>]>>"
---*)
