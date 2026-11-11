(*---
description: Compares string_set, a UserValue, with set_filter, a SetPredValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_string_set__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) = ({x \in 1..3 : x > 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_string_set__set_filter failed.
    Attempted to compare overridden value STRING with non-overridden value:
    {2, 3}
---*)
