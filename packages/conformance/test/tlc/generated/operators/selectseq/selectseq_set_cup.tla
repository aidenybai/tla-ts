(*---
description: selectseq applied to set_cup, a SetCupValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_set_cup ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq({1} \cup {2}, LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module selectseq_set_cup failed.
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    {1, 2}
---*)
