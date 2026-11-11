(*---
description: cup of set_nested, a SetEnumValue, and set_mixed, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_nested__set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) \cup ({1, "a"}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cup_set_nested__set_mixed failed.
    Attempted to compare string "a" with non-string:
    1
---*)
