(*---
description: subseq applied to union, a UnionValue.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseq_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(UNION {{1}, {2}}, 1, 1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    {1, 2}
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    {1, 2}
---*)
