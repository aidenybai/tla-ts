(*---
description: function_over applied to function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in [x \in Nat |-> x] |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in [x \\in Nat |-> <expression line 14, col 38 to line 14, col 38 of module function_over_function_lazy>] |-> <expression line 14, col 45 to line 14, col 45 of module function_over_function_lazy>]"
---*)
