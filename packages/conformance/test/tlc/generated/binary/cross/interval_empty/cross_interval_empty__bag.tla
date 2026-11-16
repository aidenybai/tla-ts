(*---
description: cross of interval_empty, a IntervalValue, and bag, a FcnRcdValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_interval_empty__bag ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \X (SetToBag({1})))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
