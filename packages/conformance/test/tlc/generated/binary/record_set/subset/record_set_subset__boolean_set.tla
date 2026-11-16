(*---
description: record_set of subset, a SubsetValue, and boolean_set, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_subset__boolean_set ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (SUBSET {1, 2}), g : (BOOLEAN)])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> {}, g |-> FALSE],
    |   [f |-> {}, g |-> TRUE],
    |   [f |-> {1}, g |-> FALSE],
    |   [f |-> {1}, g |-> TRUE],
    |   [f |-> {2}, g |-> FALSE],
    |   [f |-> {2}, g |-> TRUE],
    |   [f |-> {1, 2}, g |-> FALSE],
    |   [f |-> {1, 2}, g |-> TRUE] }
---*)
