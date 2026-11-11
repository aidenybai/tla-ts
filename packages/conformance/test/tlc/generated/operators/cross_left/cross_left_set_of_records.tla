(*---
description: cross_left applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_left_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a : {1, 2}] \X {9})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<[a |-> 1], 9>>, <<[a |-> 2], 9>>}"
---*)
