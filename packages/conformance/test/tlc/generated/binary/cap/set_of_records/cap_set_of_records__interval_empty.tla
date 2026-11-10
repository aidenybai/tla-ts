(*---
description: cap of set_of_records, a SetOfRcdsValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_of_records__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) \cap (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
