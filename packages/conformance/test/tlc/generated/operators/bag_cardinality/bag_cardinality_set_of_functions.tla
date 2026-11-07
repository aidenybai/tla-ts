(*---
description: bag_cardinality applied to set_of_functions, a SetOfFcnsValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_set_of_functions ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality([{1} -> {2, 3}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    {<<2>>, <<3>>}
    2176:0 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    {<<2>>, <<3>>}
---*)
