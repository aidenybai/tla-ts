(*---
description: function_over applied to int_minimum, a IntValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in (-2147483647 - 1) |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in -2147483648 |-> <expression line 14, col 45 to line 14, col 45 of module function_over_int_minimum>]"
---*)
