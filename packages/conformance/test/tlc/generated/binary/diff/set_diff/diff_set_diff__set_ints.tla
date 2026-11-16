(*---
description: diff of set_diff, a SetDiffValue, and set_ints, a SetEnumValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_diff__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) \ ({2, 1}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
