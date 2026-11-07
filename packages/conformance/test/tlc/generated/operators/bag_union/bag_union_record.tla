(*---
description: bag_union applied to record, a RecordValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_record ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion([a |-> 1, b |-> 2]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagUnion to the following value,
    which is not a finite enumerable set:
    [a |-> 1, b |-> 2]
    2176:0 Applying BagUnion to the following value,
    which is not a finite enumerable set:
    [a |-> 1, b |-> 2]
---*)
