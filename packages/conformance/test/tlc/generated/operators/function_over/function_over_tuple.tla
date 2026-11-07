(*---
description: function_over applied to tuple, a TupleValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in <<1, 2>> |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in <<1, 2>> |-> <expression line 14, col 36 to line 14, col 36 of module function_over_tuple>]"
---*)
