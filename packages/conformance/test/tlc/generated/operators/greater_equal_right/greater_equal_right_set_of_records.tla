(*---
description: greater_equal_right applied to set_of_records, a SetOfRcdsValue.
ref: tlc2/module/Naturals.java#GEQ
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE greater_equal_right_set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(2 >= [a : {1, 2}])
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2266:0 The second argument of >= should be an integer, but instead it is:
    {[a |-> 1], [a |-> 2]}
    2266:0 The second argument of >= should be an integer, but instead it is:
    {[a |-> 1], [a |-> 2]}
---*)
