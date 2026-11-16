(*---
description: bag_to_set applied to subset, a SubsetValue.
ref: tlc2/module/Bags.java#BagToSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_to_set_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagToSet(SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module bag_to_set_subset failed.
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    {{}, {1}, {2}, {1, 2}}
---*)
