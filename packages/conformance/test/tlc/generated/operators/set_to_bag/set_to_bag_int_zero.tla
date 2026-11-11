(*---
description: set_to_bag applied to int_zero, a IntValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_int_zero ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag(0))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module set_to_bag_int_zero failed.
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    0
---*)
