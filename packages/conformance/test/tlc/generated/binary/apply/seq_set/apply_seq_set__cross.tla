(*---
description: apply of seq_set, a UserValue, and cross, a SetOfTuplesValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_seq_set__cross ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1}))[{1, 2} \X {3}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_seq_set__cross failed.
    A non-function (a special set constant) was applied as a function.
    line 14, col 16 to line 14, col 40 of module apply_seq_set__cross
---*)
