(*---
description: record_set of boolean_set, a SetEnumValue, and set_of_records, a SetOfRcdsValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_boolean_set__set_of_records ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (BOOLEAN), g : ([a : {1, 2}])])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> FALSE, g |-> [a |-> 1]],
    |   [f |-> FALSE, g |-> [a |-> 2]],
    |   [f |-> TRUE, g |-> [a |-> 1]],
    |   [f |-> TRUE, g |-> [a |-> 2]] }
---*)
