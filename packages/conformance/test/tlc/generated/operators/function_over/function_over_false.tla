(*---
description: function_over applied to false, a BoolValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in FALSE |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in FALSE |-> <expression line 14, col 33 to line 14, col 33 of module function_over_false>]"
---*)
