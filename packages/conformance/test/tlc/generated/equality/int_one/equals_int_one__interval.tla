(*---
description: Compares int_one, a IntValue, with interval, a IntervalValue.
ref: tlc2/value/impl/IntValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_int_one__interval ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1) = (1..3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_int_one__interval failed.
    Attempted to check equality of integer 1 with non-integer:
    1..3
---*)
