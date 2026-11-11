(*---
description: Compares set_nested, a SetEnumValue, with set_map, a SetEnumValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_nested__set_map ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({{1}, {}}) = ({x + 1 : x \in 1..2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_set_nested__set_map failed.
    Attempted to check equality of the set {} with the value:
    2
---*)
