(*---
description: apply of int, a UserValue, and seq_set, a UserValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_int__seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Int)[Seq({1})])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_int__seq_set failed.
    A non-function (a special set constant) was applied as a function.
    line 14, col 16 to line 14, col 30 of module apply_int__seq_set
---*)
