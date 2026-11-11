(*---
description: Compares string_set, a UserValue, with set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/UserValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_string_set__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((STRING) = ([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_string_set__set_of_functions failed.
    Attempted to compare overridden value STRING with non-overridden value:
    {<<2>>, <<3>>}
---*)
