(*---
description: cross of set_cap, a SetCapValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_cap__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \cap {2, 3}) \X (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
