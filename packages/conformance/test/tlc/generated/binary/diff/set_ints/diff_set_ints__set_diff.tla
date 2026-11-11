(*---
description: diff of set_ints, a SetEnumValue, and set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_ints__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) \ ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {2}"
---*)
