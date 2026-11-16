(*---
description: cup of set_of_records, a SetOfRcdsValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_of_records__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) \cup ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[a |-> 1], [a |-> 2]}"
---*)
