(*---
description: diff of set_nested, a SetEnumValue, and set_empty, a SetEnumValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_nested__set_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) \ ({}))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {{}, {1}}"
---*)
