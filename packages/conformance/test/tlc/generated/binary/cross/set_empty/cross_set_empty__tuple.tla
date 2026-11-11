(*---
description: cross of set_empty, a SetEnumValue, and tuple, a TupleValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_empty__tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \X (<<1, 2>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
