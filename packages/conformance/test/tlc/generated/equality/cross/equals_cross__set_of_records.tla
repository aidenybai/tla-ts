(*---
description: Compares cross, a SetOfTuplesValue, with set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfTuplesValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_cross__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) = ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
