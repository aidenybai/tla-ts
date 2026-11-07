(*---
description: record_set of set_cap, a SetCapValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_cap__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({1, 2} \cap {2, 3}), g : (1..3)])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {[f |-> 2, g |-> 1], [f |-> 2, g |-> 2], [f |-> 2, g |-> 3]}"
---*)
