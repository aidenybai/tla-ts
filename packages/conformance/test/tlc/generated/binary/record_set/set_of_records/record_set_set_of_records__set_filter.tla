(*---
description: record_set of set_of_records, a SetOfRcdsValue, and set_filter, a SetPredValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_of_records__set_filter ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ([a : {1, 2}]), g : ({x \in 1..3 : x > 1})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> [a |-> 1], g |-> 2],
    |   [f |-> [a |-> 1], g |-> 3],
    |   [f |-> [a |-> 2], g |-> 2],
    |   [f |-> [a |-> 2], g |-> 3] }
---*)
