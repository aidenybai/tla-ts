(*---
description: append of bag, a FcnRcdValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_bag__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SetToBag({1}), [x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, [x \\in Nat |-> <expression line 14, col 53 to line 14, col 53 of module append_bag__function_lazy>]>>"
---*)
