(*---
description: cup of int_minimum, a IntValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_int_minimum__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-2147483647 - 1)) \cup (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| -2147483648"
---*)
