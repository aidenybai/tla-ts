(*---
description: record_set of set_cup, a SetCupValue, and set_cup, a SetCupValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_cup__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({1} \cup {2}), g : ({1} \cup {2})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> 1, g |-> 1], [f |-> 1, g |-> 2], [f |-> 2, g |-> 1], [f |-> 2, g |-> 2]}"
---*)
