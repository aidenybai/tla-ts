(*---
description: function_over applied to int, a UserValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in Int |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in Int |-> <expression line 14, col 31 to line 14, col 31 of module function_over_int>]"
---*)
