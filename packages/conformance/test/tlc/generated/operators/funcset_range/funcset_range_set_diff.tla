(*---
description: funcset_range applied to set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE funcset_range_set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([{9} -> {1, 2} \ {2}])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {(9 :> 1)}"
---*)
