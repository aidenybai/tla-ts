(*---
description: record_set of subset, a SubsetValue, and set_nested, a SetEnumValue.
ref: tlc2/value/impl/SetOfRcdsValue.java
features:
  - value-matrix
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE record_set_subset__set_nested ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([f : (SUBSET {1, 2}), g : ({{1}, {}})])
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | { [f |-> {}, g |-> {}],
    |   [f |-> {}, g |-> {1}],
    |   [f |-> {1}, g |-> {}],
    |   [f |-> {1}, g |-> {1}],
    |   [f |-> {2}, g |-> {}],
    |   [f |-> {2}, g |-> {1}],
    |   [f |-> {1, 2}, g |-> {}],
    |   [f |-> {1, 2}, g |-> {1}] }
---*)
