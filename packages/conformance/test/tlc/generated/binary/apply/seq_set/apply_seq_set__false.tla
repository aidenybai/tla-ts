(*---
description: apply of seq_set, a UserValue, and false, a BoolValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_seq_set__false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1}))[FALSE])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_seq_set__false failed.
    A non-function (a special set constant) was applied as a function.
    line 14, col 16 to line 14, col 32 of module apply_seq_set__false
---*)
