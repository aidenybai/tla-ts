(*---
description: bag_union applied to function_lazy, a FcnLambdaValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_function_lazy ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion([x \in Nat |-> x]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagUnion to the following value,
    which is not a finite enumerable set:
    [x \in Nat |-> <expression line 14, col 40 to line 14, col 40 of module bag_union_function_lazy>]
    2176:0 Applying BagUnion to the following value,
    which is not a finite enumerable set:
    [x \in Nat |-> <expression line 14, col 40 to line 14, col 40 of module bag_union_function_lazy>]
---*)
