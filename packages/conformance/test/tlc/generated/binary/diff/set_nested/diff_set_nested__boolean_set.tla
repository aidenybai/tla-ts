(*---
description: diff of set_nested, a SetEnumValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetDiffValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE diff_set_nested__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) \ (BOOLEAN))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module diff_set_nested__boolean_set failed.
    Attempted to compare the set {1} with the value:
    TRUE
---*)
