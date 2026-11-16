(*---
description: cup of tuple, a TupleValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_tuple__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<1, 2>>) \cup ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| <<1, 2>>"
---*)
