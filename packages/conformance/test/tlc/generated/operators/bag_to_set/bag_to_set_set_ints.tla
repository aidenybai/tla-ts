(*---
description: bag_to_set applied to set_ints, a SetEnumValue.
ref: tlc2/module/Bags.java#BagToSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_to_set_set_ints ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagToSet({2, 1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    {1, 2}
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    {1, 2}
---*)
