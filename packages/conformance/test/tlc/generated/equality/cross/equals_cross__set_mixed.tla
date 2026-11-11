(*---
description: Compares cross, a SetOfTuplesValue, with set_mixed, a SetEnumValue.
ref: tlc2/value/impl/SetOfTuplesValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_cross__set_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({1, 2} \X {3}) = ({1, "a"}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_cross__set_mixed failed.
    Attempted to compare string "a" with non-string:
    1
---*)
