(*---
description: bag_plus applied to record_nested, a RecordValue.
ref: tlc2/module/Bags.java#BagUnion
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE bag_plus_record_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([a |-> [b |-> <<1>>]] (+) SetToBag({1}))
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2169:0 The first argument of (+) should be a bag, but instead it is:
    [a |-> [b |-> <<1>>]]
    2169:0 The first argument of (+) should be a bag, but instead it is:
    [a |-> [b |-> <<1>>]]
---*)
