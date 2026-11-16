(*---
description: apply of interval, a IntervalValue, and subset, a SubsetValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_interval__subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1..3)[SUBSET {1, 2}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_interval__subset failed.
    A non-function (a set of the form i..j) was applied as a function.
    line 14, col 16 to line 14, col 36 of module apply_interval__subset
---*)
