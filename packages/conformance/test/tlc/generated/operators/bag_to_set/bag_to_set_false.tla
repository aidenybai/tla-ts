(*---
description: bag_to_set applied to false, a BoolValue.
ref: tlc2/module/Bags.java#BagToSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_to_set_false ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagToSet(FALSE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    FALSE
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    FALSE
---*)
