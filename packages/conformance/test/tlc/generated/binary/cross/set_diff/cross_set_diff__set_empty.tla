(*---
description: cross of set_diff, a SetDiffValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_diff__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) \X ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
