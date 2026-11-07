(*---
description: bag_union applied to tuple_mixed, a TupleValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion(<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagUnion to the following value,
    which is not a finite enumerable set:
    <<1, "a", {TRUE}>>
    2176:0 Applying BagUnion to the following value,
    which is not a finite enumerable set:
    <<1, "a", {TRUE}>>
---*)
