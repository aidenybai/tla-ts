(*---
description: head applied to union, a UnionValue.
ref: tlc2/module/Sequences.java#Head
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE head_union ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Head(UNION {{1}, {2}}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module head_union failed.
    2283:0 The argument of Head should be a sequence, but instead it is:
    {1, 2}
---*)
