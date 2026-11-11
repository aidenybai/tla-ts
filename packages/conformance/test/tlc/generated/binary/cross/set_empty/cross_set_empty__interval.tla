(*---
description: cross of set_empty, a SetEnumValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_empty__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \X (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
