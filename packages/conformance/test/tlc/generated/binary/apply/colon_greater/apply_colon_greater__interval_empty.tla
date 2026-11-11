(*---
description: apply of colon_greater, a FcnRcdValue, and interval_empty, a IntervalValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_colon_greater__interval_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((1 :> 2)[3..1])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_colon_greater__interval_empty failed.
    Attempted to check equality of integer 1 with non-integer:
    {}
---*)
