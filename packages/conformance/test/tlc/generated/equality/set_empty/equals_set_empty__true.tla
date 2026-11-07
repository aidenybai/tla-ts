(*---
description: Compares set_empty, a SetEnumValue, with true, a BoolValue.
ref: tlc2/value/impl/SetEnumValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_empty__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({}) = (TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_set_empty__true failed.
    Attempted to check equality of the set {} with the value:
    TRUE
---*)
