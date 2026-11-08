(*---
description: subseq applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseq_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([a : {1, 2}], 1, 1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseq_set_of_records failed.
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    {[a |-> 1], [a |-> 2]}
---*)
