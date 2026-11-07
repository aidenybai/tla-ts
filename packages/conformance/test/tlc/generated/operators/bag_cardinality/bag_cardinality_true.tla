(*---
description: bag_cardinality applied to true, a BoolValue.
ref: tlc2/module/Bags.java#BagCardinality
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_cardinality_true ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(BagCardinality(TRUE))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2176:0 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    TRUE
    2176:0 Applying BagCardinality to the following value,
    which is not a function with a finite domain:
    TRUE
---*)
