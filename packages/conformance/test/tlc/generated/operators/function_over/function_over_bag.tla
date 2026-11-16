(*---
description: function_over applied to bag, a FcnRcdValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in SetToBag({1}) |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in <<1>> |-> <expression line 14, col 41 to line 14, col 41 of module function_over_bag>]"
---*)
