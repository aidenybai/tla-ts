(*---
description: bag_union applied to function_empty, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_function_empty ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion([x \in {} |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagUnion to the following value,
    which is not a finite enumerable set:
    <<>>
    2176:0 Applying BagUnion to the following value,
    which is not a finite enumerable set:
    <<>>
---*)
