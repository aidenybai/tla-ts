(*---
description: function_over applied to int_one, a IntValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in 1 |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in 1 |-> <expression line 14, col 29 to line 14, col 29 of module function_over_int_one>]"
---*)
