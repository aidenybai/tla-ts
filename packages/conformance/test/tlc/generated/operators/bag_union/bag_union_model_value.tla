(*---
description: bag_union applied to model_value, a ModelValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
config: |
  CONSTANT mv = mv
---*)
---- MODULE bag_union_model_value ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
CONSTANT mv
Test == PrintT(BagUnion(mv))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 18, col 8 to line 18, col 11 of module bag_union_model_value failed.
    2176:0 Applying BagUnion to the following value,
    which is not a finite enumerable set:
    mv
---*)
