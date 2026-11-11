(*---
description: diff of set_empty, a SetEnumValue, and int, a UserValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_empty__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) \ (Int))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {}"
---*)
