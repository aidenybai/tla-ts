(*---
description: cup of set_diff, a SetDiffValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_diff__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) \cup ({{1}, {}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cup_set_diff__set_nested failed.
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
