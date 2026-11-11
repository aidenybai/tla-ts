(*---
description: function_set of interval_empty, a IntervalValue, and set_cap, a SetCapValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_interval_empty__set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(3..1) -> ({1, 2} \cap {2, 3})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
