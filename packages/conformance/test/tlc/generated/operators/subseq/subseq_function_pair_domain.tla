(*---
description: subseq applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/module/Sequences.java#SubSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE subseq_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq([x \in {1}, y \in {2} |-> x + y], 1, 1))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    (<<1, 2>> :> 3)
    2169:0 The first argument of SubSeq should be a sequence, but instead it is:
    (<<1, 2>> :> 3)
---*)
