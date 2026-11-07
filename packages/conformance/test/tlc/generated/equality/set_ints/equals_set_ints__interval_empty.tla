(*---
description: Compares set_ints, a SetEnumValue, with interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_ints__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) = (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
