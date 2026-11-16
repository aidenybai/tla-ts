(*---
description: cap of interval_empty, a IntervalValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_interval_empty__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \cap ({1, 2} \X {3}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
