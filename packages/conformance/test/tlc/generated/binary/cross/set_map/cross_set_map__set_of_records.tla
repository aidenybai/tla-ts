(*---
description: cross of set_map, a SetEnumValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfTuplesValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE cross_set_map__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(({x + 1 : x \in 1..2}) \X ([a : {1, 2}]))
====

(*--- recorded
all:
  exit: 0
  transcript: "| {<<2, [a |-> 1]>>, <<2, [a |-> 2]>>, <<3, [a |-> 1]>>, <<3, [a |-> 2]>>}"
---*)
