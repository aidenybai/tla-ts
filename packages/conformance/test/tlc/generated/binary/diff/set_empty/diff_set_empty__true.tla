(*---
description: diff of set_empty, a SetEnumValue, and true, a BoolValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_empty__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \ (TRUE))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
