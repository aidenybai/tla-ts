(*---
description: function_over applied to function_empty, a FcnRcdValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in [x \in {} |-> x] |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in <<>> |-> <expression line 14, col 44 to line 14, col 44 of module function_over_function_empty>]"
---*)
