(*---
description: set_to_bag applied to tuple_mixed, a TupleValue.
ref: tlc2/module/Bags.java#SetToBag
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE set_to_bag_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SetToBag(<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    <<1, "a", {TRUE}>>
    2176:0 Applying BagToSet to the following value,
    which is not a function with a finite domain:
    <<1, "a", {TRUE}>>
---*)
