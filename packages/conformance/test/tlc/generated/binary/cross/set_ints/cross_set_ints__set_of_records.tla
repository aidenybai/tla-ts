(*---
description: cross of set_ints, a SetEnumValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_ints__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({2, 1}) \X ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<1, [a |-> 1]>>, <<1, [a |-> 2]>>, <<2, [a |-> 1]>>, <<2, [a |-> 2]>>}"
---*)
