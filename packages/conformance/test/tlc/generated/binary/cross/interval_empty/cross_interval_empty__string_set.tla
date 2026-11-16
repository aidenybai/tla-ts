(*---
description: cross of interval_empty, a IntervalValue, and string_set, a UserValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_interval_empty__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1) \X (STRING))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
