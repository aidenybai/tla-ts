(*---
description: cup of interval_empty, a IntervalValue, and function_lazy, a FcnLambdaValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_interval_empty__function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \cup ([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| [x \\in Nat |-> <expression line 14, col 44 to line 14, col 44 of module cup_interval_empty__function_lazy>]"
---*)
