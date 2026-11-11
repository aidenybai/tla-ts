(*---
description: record_set of set_of_records, a SetOfRcdsValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_set_of_records__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : ([a : {1, 2}]), g : (BOOLEAN)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> [a |-> 1], g |-> FALSE],
    |   [f |-> [a |-> 1], g |-> TRUE],
    |   [f |-> [a |-> 2], g |-> FALSE],
    |   [f |-> [a |-> 2], g |-> TRUE] }
---*)
