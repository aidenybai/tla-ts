(*---
description: function_over applied to int_maximum, a IntValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in 2147483647 |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in 2147483647 |-> <expression line 14, col 38 to line 14, col 38 of module function_over_int_maximum>]"
---*)
