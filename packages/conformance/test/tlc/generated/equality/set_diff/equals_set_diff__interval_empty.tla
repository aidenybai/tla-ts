(*---
description: Compares set_diff, a SetDiffValue, with interval_empty, a IntervalValue.
ref: tlc2/value/impl/SetDiffValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_diff__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) = (3..1))
====

(*--- recorded
all:
  exit: 0
  transcript: "| FALSE"
---*)
