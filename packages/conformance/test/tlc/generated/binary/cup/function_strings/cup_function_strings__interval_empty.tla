(*---
description: cup of function_strings, a FcnRcdValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_function_strings__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([x \in {"a", "b"} |-> x]) \cup (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: '| [a |-> "a", b |-> "b"]'
---*)
