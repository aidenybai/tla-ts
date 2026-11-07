(*---
description: Compares int_negative, a IntValue, with int, a UserValue.
ref: tlc2/value/impl/IntValue.java#equals
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE equals_int_negative__int ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((-3) = (Int))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module equals_int_negative__int failed.
    Attempted to check equality of integer -3 with non-integer:
    Int
---*)
