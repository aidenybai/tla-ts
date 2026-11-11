(*---
description: Asks whether set_of_records is in set_map, a SetEnumValue.
ref: tlc2/value/impl/SetEnumValue.java#member
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE in_set_map__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) \in ({x + 1 : x \in 1..2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module in_set_map__set_of_records failed.
    Attempted to check equality of integer 2 with non-integer:
    {[a |-> 1], [a |-> 2]}
---*)
