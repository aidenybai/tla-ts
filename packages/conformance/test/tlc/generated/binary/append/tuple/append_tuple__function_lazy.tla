(*---
description: append of tuple, a TupleValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<1, 2>>, [x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2, [x \\in Nat |-> <expression line 14, col 48 to line 14, col 48 of module append_tuple__function_lazy>]>>"
---*)
