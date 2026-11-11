(*---
description: cross of set_empty, a SetEnumValue, and subset, a SubsetValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_empty__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \X (SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
