(*---
description: cup of tuple, a TupleValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_tuple__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, 2>>) \cup (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2>>"
---*)
