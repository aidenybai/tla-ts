(*---
description: bag_cardinality applied to set_ints, a SetEnumValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality({2, 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    {1, 2}
    2176:0 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    {1, 2}
---*)
