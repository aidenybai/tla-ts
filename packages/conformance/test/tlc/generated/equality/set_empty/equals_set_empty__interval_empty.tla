(*---
description: Compares set_empty, a SetEnumValue, with interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_empty__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) = (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| TRUE"
---*)
