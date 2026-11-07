(*---
description: cup of cross, a SetOfTuplesValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_cross__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) \cup (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, 3>>, <<2, 3>>}"
---*)
