(*---
description: bag_union applied to int_negative, a IntValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion(-3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagUnion to the following value,
    which is not a finite enumerable set:
    -3
    2176:0 Applying BagUnion to the following value,
    which is not a finite enumerable set:
    -3
---*)
