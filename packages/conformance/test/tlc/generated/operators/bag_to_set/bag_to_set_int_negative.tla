(*---
description: bag_to_set applied to int_negative, a IntValue.
ref: tlc2/module/Bags.java#BagToSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_to_set_int_negative ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagToSet(-3))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    -3
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    -3
---*)
