(*---
description: cup of set_empty, a SetEnumValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_empty__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \cup ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [x \\in Nat |-> <expression line 14, col 42 to line 14, col 42 of module cup_set_empty__function_lazy>]"
---*)
