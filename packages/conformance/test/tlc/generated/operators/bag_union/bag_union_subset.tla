(*---
description: bag_union applied to subset, a SubsetValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_union_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagUnion(SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module bag_union_subset failed.
    2177:0 Attempted to apply BagUnion to the following set, whose
    element is not a bag:
    {{}, {1}, {2}, {1, 2}}
---*)
