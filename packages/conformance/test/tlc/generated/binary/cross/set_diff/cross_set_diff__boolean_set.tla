(*---
description: cross of set_diff, a SetDiffValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_diff__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) \X (BOOLEAN))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, FALSE>>, <<1, TRUE>>}"
---*)
