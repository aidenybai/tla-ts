(*---
description: diff of set_of_records, a SetOfRcdsValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_of_records__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) \ ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
