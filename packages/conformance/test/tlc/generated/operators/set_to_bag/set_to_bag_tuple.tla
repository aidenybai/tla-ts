(*---
description: set_to_bag applied to tuple, a TupleValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_tuple ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag(<<1, 2>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    <<1, 2>>
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    <<1, 2>>
---*)
