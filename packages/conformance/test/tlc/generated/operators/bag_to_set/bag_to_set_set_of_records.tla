(*---
description: bag_to_set applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Bags.java#BagToSet
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_to_set_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagToSet([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    {[a |-> 1], [a |-> 2]}
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    {[a |-> 1], [a |-> 2]}
---*)
