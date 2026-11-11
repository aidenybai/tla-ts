(*---
description: cup of set_nested, a SetEnumValue, and set_cup, a SetCupValue.
ref: tlc2/value/impl/SetCupValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cup_set_nested__set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) \cup ({1} \cup {2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module cup_set_nested__set_cup failed.
    Attempted to check equality of the set {1} with the value:
    1
---*)
