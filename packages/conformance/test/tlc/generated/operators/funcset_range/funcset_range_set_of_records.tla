(*---
description: funcset_range applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_range_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{9} -> [a : {1, 2}]])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(9 :> [a |-> 1]), (9 :> [a |-> 2])}"
---*)
