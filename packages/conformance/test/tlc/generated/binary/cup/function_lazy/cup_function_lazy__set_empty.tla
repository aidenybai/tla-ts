(*---
description: cup of function_lazy, a FcnLambdaValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_function_lazy__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in Nat |-> x]) \cup ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [x \\in Nat |-> <expression line 14, col 32 to line 14, col 32 of module cup_function_lazy__set_empty>]"
---*)
