(*---
description: record_set of set_of_records, a SetOfRcdsValue, and set_cap, a SetCapValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_of_records__set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ([a : {1, 2}]), g : ({1, 2} \cap {2, 3})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> [a |-> 1], g |-> 2], [f |-> [a |-> 2], g |-> 2]}"
---*)
