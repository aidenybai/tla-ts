(*---
description: set_to_bag applied to int_minimum, a IntValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_int_minimum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag((-2147483647 - 1)))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    -2147483648
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    -2147483648
---*)
