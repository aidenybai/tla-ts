(*---
description: bag_cardinality applied to record_nested, a RecordValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality([a |-> [b |-> <<1>>]]))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagCardinality to the following value,
    which is not a bag:
    [a |-> [b |-> <<1>>]]
    2176:0 Applying BagCardinality to the following value,
    which is not a bag:
    [a |-> [b |-> <<1>>]]
---*)
