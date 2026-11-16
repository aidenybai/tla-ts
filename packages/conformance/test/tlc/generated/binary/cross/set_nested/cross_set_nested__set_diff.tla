(*---
description: cross of set_nested, a SetEnumValue, and set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_nested__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) \X ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<{}, 1>>, <<{1}, 1>>}"
---*)
