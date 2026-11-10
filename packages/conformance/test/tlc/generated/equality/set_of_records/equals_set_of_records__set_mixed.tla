(*---
description: Compares set_of_records, a SetOfRcdsValue, with set_mixed, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_of_records__set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([a : {1, 2}]) = ({1, "a"}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_set_of_records__set_mixed failed.
    Attempted to compare string "a" with non-string:
    1
---*)
