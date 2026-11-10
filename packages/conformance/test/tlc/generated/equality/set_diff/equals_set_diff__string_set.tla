(*---
description: Compares set_diff, a SetDiffValue, with string_set, a UserValue.
ref: tlc2/value/impl/SetDiffValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_set_diff__string_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \ {2}) = (STRING))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_set_diff__string_set failed.
    Attempted to check equality of the set {1} with the value:
    STRING
---*)
