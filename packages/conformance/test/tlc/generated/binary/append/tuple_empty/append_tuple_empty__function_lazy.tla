(*---
description: append of tuple_empty, a TupleValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/module/Sequences.java#Append
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE append_tuple_empty__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(<<>>, [x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<[x \\in Nat |-> <expression line 14, col 44 to line 14, col 44 of module append_tuple_empty__function_lazy>]>>"
---*)
