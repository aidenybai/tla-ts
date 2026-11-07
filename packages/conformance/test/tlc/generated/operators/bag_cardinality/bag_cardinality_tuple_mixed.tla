(*---
description: bag_cardinality applied to tuple_mixed, a TupleValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_tuple_mixed ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality(<<1, "a", {TRUE}>>))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagCardinality to the following value,
    which is not a bag:
    <<1, "a", {TRUE}>>
    2176:0 Applying BagCardinality to the following value,
    which is not a bag:
    <<1, "a", {TRUE}>>
---*)
