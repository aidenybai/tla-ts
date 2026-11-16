(*---
description: function_set of interval_empty, a IntervalValue, and union, a UnionValue.
ref: tlc2/value/impl/SetOfFcnsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE function_set_interval_empty__union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(3..1) -> (UNION {{1}, {2}})])
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<>>}"
---*)
