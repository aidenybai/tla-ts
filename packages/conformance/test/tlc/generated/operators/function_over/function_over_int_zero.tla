(*---
description: function_over applied to int_zero, a IntValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in 0 |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in 0 |-> <expression line 14, col 29 to line 14, col 29 of module function_over_int_zero>]"
---*)
