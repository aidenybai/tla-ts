(*---
description: function_over applied to function, a FcnRcdValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_function ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in [x \in {1, 2} |-> x * 2] |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in <<2, 4>> |-> <expression line 14, col 52 to line 14, col 52 of module function_over_function>]"
---*)
