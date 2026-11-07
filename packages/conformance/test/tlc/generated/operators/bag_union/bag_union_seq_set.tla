(*---
description: bag_union applied to seq_set, a UserValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_seq_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion(Seq({1})))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagUnion to the following value,
    which is not a finite enumerable set:
    Seq({1})
    2176:0 Applying BagUnion to the following value,
    which is not a finite enumerable set:
    Seq({1})
---*)
