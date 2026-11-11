(*---
description: cross of set_cup, a SetCupValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_cup__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1} \cup {2}) \X (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
