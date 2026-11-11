(*---
description: cup of set_of_records, a SetOfRcdsValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_of_records__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) \cup ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[a |-> 1], [a |-> 2]}"
---*)
