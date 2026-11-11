(*---
description: Compares int_maximum, a IntValue, with true, a BoolValue.
ref: tlc2/value/impl/IntValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_int_maximum__true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((2147483647) = (TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_int_maximum__true failed.
    Attempted to check equality of integer 2147483647 with non-integer:
    TRUE
---*)
