(*---
description: function_over applied to string_set, a UserValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in STRING |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in STRING |-> <expression line 14, col 34 to line 14, col 34 of module function_over_string_set>]"
---*)
