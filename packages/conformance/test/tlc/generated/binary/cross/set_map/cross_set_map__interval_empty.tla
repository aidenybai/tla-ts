(*---
description: cross of set_map, a SetEnumValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_map__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x + 1 : x \in 1..2}) \X (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
