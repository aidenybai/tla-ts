(*---
description: record_set of set_filter, a SetPredValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_filter__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ({x \in 1..3 : x > 1}), g : ([a : {1, 2}])])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> 2, g |-> [a |-> 1]],
    |   [f |-> 2, g |-> [a |-> 2]],
    |   [f |-> 3, g |-> [a |-> 1]],
    |   [f |-> 3, g |-> [a |-> 2]] }
---*)
