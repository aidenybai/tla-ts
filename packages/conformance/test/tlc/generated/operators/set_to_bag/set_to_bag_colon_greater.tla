(*---
description: set_to_bag applied to colon_greater, a FcnRcdValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_colon_greater ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag(1 :> 2))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    <<2>>
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    <<2>>
---*)
