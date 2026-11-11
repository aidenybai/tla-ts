(*---
description: diff of set_ints, a SetEnumValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_ints__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) \ (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
