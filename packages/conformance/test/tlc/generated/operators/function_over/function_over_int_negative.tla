(*---
description: function_over applied to int_negative, a IntValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in -3 |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in -3 |-> <expression line 14, col 30 to line 14, col 30 of module function_over_int_negative>]"
---*)
