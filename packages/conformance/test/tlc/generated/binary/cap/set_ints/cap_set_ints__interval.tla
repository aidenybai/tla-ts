(*---
description: cap of set_ints, a SetEnumValue, and interval, a IntervalValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_ints__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) \cap (1..3))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {1, 2}"
---*)
