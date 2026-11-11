(*---
description: diff of set_empty, a SetEnumValue, and set_mixed, a SetEnumValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_empty__set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \ ({1, "a"}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
