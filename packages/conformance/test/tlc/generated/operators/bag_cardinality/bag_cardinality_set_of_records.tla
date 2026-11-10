(*---
description: bag_cardinality applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2105:1 Evaluating assumption line 15, col 8 to line 15, col 11 of module bag_cardinality_set_of_records failed.
    2176:0 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    {[a |-> 1], [a |-> 2]}
---*)
