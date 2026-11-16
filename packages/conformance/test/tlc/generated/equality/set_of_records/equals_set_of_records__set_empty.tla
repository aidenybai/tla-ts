(*---
description: Compares set_of_records, a SetOfRcdsValue, with set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_of_records__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) = ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
