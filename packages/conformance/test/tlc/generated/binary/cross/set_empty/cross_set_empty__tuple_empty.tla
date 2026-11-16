(*---
description: cross of set_empty, a SetEnumValue, and tuple_empty, a TupleValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_empty__tuple_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \X (<<>>))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
