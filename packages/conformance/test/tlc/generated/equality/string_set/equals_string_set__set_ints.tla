(*---
description: Compares string_set, a UserValue, with set_ints, a SetEnumValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_string_set__set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) = ({2, 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_string_set__set_ints failed.
    Attempted to compare overridden value STRING with non-overridden value:
    {1, 2}
---*)
