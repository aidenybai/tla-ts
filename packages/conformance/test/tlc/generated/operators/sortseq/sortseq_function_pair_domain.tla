(*---
description: sortseq applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/module/TLC.java#SortSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE sortseq_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SortSeq([x \in {1}, y \in {2} |-> x + y], LAMBDA a, b : a < b))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    (<<1, 2>> :> 3)
    2169:0 The first argument of SortSeq should be a natural number, but instead it is:
    (<<1, 2>> :> 3)
---*)
