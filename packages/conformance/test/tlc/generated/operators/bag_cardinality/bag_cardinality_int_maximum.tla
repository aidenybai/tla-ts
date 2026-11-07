(*---
description: bag_cardinality applied to int_maximum, a IntValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_int_maximum ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality(2147483647))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    2147483647
    2176:0 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    2147483647
---*)
