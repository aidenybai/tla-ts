(*---
description: function_over applied to double_at, a FcnRcdValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_double_at ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in (1 :> 2) @@ (2 :> 3) |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in <<2, 3>> |-> <expression line 14, col 48 to line 14, col 48 of module function_over_double_at>]"
---*)
