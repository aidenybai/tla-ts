(*---
description: cap of set_ints, a SetEnumValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetCapValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cap_set_ints__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) \cap (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
