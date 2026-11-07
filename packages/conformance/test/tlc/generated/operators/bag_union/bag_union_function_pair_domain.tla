(*---
description: bag_union applied to function_pair_domain, a FcnRcdValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_function_pair_domain ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion([x \in {1}, y \in {2} |-> x + y]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagUnion to the following value,
    which is not a finite enumerable set:
    (<<1, 2>> :> 3)
    2176:0 Applying BagUnion to the following value,
    which is not a finite enumerable set:
    (<<1, 2>> :> 3)
---*)
