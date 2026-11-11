(*---
description: cup of interval_empty, a IntervalValue, and function_strings, a FcnRcdValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_interval_empty__function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \cup ([x \in {"a", "b"} |-> x]))
====

(*--- recorded
all:
  exit: 0
  transcript: '| [a |-> "a", b |-> "b"]'
---*)
