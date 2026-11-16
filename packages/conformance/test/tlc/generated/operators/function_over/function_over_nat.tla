(*---
description: function_over applied to nat, a UserValue.
ref: tlc2/value/impl/FcnLambdaValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_over_nat ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([e \in Nat |-> e])
====

(*--- recorded
all:
  exit: 0
  transcript: "| [e \\in Nat |-> <expression line 14, col 31 to line 14, col 31 of module function_over_nat>]"
---*)
