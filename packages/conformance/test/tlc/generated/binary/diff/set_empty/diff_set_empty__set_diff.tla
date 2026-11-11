(*---
description: diff of set_empty, a SetEnumValue, and set_diff, a SetDiffValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_empty__set_diff ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \ ({1, 2} \ {2}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
