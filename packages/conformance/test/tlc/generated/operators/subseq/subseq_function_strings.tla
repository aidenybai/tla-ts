(*---
description: subseq applied to function_strings, a FcnRcdValue.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseq_function_strings ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([x \in {"a", "b"} |-> x], 1, 1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module subseq_function_strings failed.
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    [a |-> "a", b |-> "b"]
---*)
