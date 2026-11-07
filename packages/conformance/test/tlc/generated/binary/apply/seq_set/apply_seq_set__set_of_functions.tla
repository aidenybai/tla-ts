(*---
description: apply of seq_set, a UserValue, and set_of_functions, a SetOfFcnsValue.
ref: tlc2/value/impl/FcnRcdValue.java#apply
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE apply_seq_set__set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Seq({1}))[[{1} -> {2, 3}]])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module apply_seq_set__set_of_functions failed.
    A non-function (a special set constant) was applied as a function.
    line 14, col 16 to line 14, col 42 of module apply_seq_set__set_of_functions
---*)
