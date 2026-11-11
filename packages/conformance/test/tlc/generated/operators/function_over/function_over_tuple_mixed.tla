(*---
description: function_over applied to tuple_mixed, a TupleValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in <<1, "a", {TRUE}>> |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: '| [e \in <<1, "a", {TRUE}>> |-> <expression line 14, col 46 to line 14, col 46 of module function_over_tuple_mixed>]'
---*)
