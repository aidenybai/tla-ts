(*---
description: function_over applied to true, a BoolValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in TRUE |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in TRUE |-> <expression line 14, col 32 to line 14, col 32 of module function_over_true>]"
---*)
