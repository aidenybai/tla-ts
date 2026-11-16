(*---
description: apply of int_zero, a IntValue, and subset, a SubsetValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_int_zero__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((0)[SUBSET {1, 2}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_int_zero__subset failed.
    A non-function (an integer) was applied as a function.
    line 14, col 16 to line 14, col 33 of module apply_int_zero__subset
---*)
