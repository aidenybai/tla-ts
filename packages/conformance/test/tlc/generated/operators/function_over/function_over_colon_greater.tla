(*---
description: function_over applied to colon_greater, a FcnRcdValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in 1 :> 2 |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in <<2>> |-> <expression line 14, col 34 to line 14, col 34 of module function_over_colon_greater>]"
---*)
