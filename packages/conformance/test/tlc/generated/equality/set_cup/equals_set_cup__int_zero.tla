(*---
description: Compares set_cup, a SetCupValue, with int_zero, a IntValue.
ref: tlc2/value/impl/SetCupValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_cup__int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1} \cup {2}) = (0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_set_cup__int_zero failed.
    Attempted to check equality of the set {1, 2} with the value:
    0
---*)
