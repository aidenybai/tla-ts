(*---
description: diff_right applied to set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_right_set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({1, 2} \ {2, 1})
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
