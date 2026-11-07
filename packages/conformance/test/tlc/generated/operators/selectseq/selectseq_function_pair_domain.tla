(*---
description: selectseq applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/module/Sequences.java#SelectSeq
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE selectseq_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SelectSeq([x \in {1}, y \in {2} |-> x + y], LAMBDA e : TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    (<<1, 2>> :> 3)
    2169:0 The first argument of SelectSeq should be a sequence, but instead it is:
    (<<1, 2>> :> 3)
---*)
