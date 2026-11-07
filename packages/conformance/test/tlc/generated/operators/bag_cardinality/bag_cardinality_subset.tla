(*---
description: bag_cardinality applied to subset, a SubsetValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_subset ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality(SUBSET {1, 2}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    {{}, {1}, {2}, {1, 2}}
    2176:0 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    {{}, {1}, {2}, {1, 2}}
---*)
