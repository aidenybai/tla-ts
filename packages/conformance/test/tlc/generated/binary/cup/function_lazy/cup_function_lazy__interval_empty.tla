(*---
description: cup of function_lazy, a FcnLambdaValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_function_lazy__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x]) \cup (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [x \\in Nat |-> <expression line 14, col 32 to line 14, col 32 of module cup_function_lazy__interval_empty>]"
---*)
