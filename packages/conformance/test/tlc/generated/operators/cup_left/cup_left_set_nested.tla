(*---
description: cup_left applied to set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_left_set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({{1}, {}} \cup {9})
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cup_left_set_nested failed.
    Attempted to check equality of the set {1} with the value:
    9
---*)
