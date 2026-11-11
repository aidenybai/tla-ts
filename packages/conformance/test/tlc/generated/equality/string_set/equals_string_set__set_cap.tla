(*---
description: Compares string_set, a UserValue, with set_cap, a SetCapValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_string_set__set_cap ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) = ({1, 2} \cap {2, 3}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_string_set__set_cap failed.
    Attempted to compare overridden value STRING with non-overridden value:
    {2}
---*)
