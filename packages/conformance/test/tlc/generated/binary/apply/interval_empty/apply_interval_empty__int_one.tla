(*---
description: apply of interval_empty, a IntervalValue, and int_one, a IntValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_interval_empty__int_one ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((3..1)[1])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_interval_empty__int_one failed.
    A non-function (a set of the form i..j) was applied as a function.
    line 14, col 16 to line 14, col 24 of module apply_interval_empty__int_one
---*)
