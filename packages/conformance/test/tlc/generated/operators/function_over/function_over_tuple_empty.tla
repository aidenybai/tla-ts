(*---
description: function_over applied to tuple_empty, a TupleValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in <<>> |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in <<>> |-> <expression line 14, col 32 to line 14, col 32 of module function_over_tuple_empty>]"
---*)
